<template>
  <div class="overlay" @click.self="$emit('close')">
    <form class="modal" @submit.prevent="save">
      <div class="modal-header">
        <h2>
          {{ isCreation ? $t('adminRetros.edit.createTitle') : $t('adminRetros.edit.title') }}
        </h2>
        <button
          type="button"
          class="close"
          :aria-label="$t('common.close')"
          :title="$t('common.close')"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <p v-if="loading" class="info">{{ $t('common.loading') }}</p>

      <template v-else>
        <p v-if="messageError" class="message">{{ messageError }}</p>

        <div class="form-group">
          <label for="retro-edit-name">{{ $t('adminRetros.edit.retroName') }}</label>
          <input id="retro-edit-name" v-model="form.name" type="text" required />
        </div>

        <h3 class="section-label">{{ $t('adminRetros.edit.categories') }}</h3>
        <div class="categories">
          <div v-for="(cat, index) in form.categories" :key="cat.key" class="category-card">
            <div class="category-header">
              <span class="category-index">{{ index + 1 }}</span>
              <button
                type="button"
                class="delete"
                :aria-label="$t('adminRetros.edit.removeCategory')"
                :title="$t('adminRetros.edit.removeCategory')"
                @click="removeCategory(index)"
              >
                🗑️
              </button>
            </div>

            <div class="form-group">
              <label>{{ $t('adminRetros.edit.categoryName') }}</label>
              <input v-model="cat.name" type="text" required />
            </div>
            <div class="form-group">
              <label>{{ $t('adminRetros.edit.categoryDescription') }}</label>
              <input v-model="cat.description" type="text" required />
            </div>

            <div class="form-group">
              <label>{{ $t('adminRetros.edit.image') }}</label>
              <div class="image-row">
                <img
                  v-if="displayedImage(cat)"
                  :src="displayedImage(cat)"
                  :alt="cat.name"
                  class="image-preview"
                />
                <span v-else class="no-image">{{ $t('adminRetros.edit.noImage') }}</span>

                <div v-if="imagesAllowed" class="image-actions">
                  <label class="file-button">
                    {{
                      displayedImage(cat)
                        ? $t('adminRetros.edit.changeImage')
                        : $t('adminRetros.edit.addImage')
                    }}
                    <input type="file" accept="image/*" @change="selectImage($event, cat)" />
                  </label>
                  <button
                    v-if="displayedImage(cat)"
                    type="button"
                    class="link-button"
                    @click="clearImage(cat)"
                  >
                    {{ $t('adminRetros.edit.removeImage') }}
                  </button>
                  <button
                    v-else-if="cat.removeImage"
                    type="button"
                    class="link-button"
                    @click="cat.removeImage = false"
                  >
                    {{ $t('adminRetros.edit.undo') }}
                  </button>
                </div>
              </div>
              <p v-if="!imagesAllowed" class="hint">{{ $t('adminRetros.edit.imagesPlanHint') }}</p>
            </div>
          </div>
        </div>

        <button type="button" class="secondary-btn" @click="addCategory">
          {{ $t('adminRetros.edit.addCategory') }}
        </button>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="$emit('close')">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" class="primary-btn" :disabled="saving">
            {{ saving ? $t('adminRetros.edit.saving') : submitText }}
          </button>
        </div>
      </template>
    </form>
  </div>
</template>

<script>
import AdminService from './../AdminService';

let nextKey = 0;

export default {
  props: {
    // Sans rétro : mode création
    retro: {
      type: Object,
      default: null,
    },
    submitLabel: {
      type: String,
      default: '',
    },
  },
  emits: ['close', 'saved'],
  data() {
    return {
      loading: true,
      saving: false,
      messageError: '',
      imagesAllowed: false,
      form: {
        name: this.retro?.name || '',
        categories: [],
      },
    };
  },
  computed: {
    isCreation() {
      return !this.retro;
    },
    submitText() {
      if (this.submitLabel) return this.submitLabel;
      return this.isCreation
        ? this.$t('adminRetros.edit.create')
        : this.$t('adminRetros.edit.save');
    },
  },
  mounted() {
    this.load();
  },
  beforeUnmount() {
    this.form.categories.forEach((cat) => this.revokePreview(cat));
  },
  methods: {
    async load() {
      if (this.isCreation) {
        this.addCategory();
        this.addCategory();
        try {
          const resultCompanie = await AdminService.getCompanie();
          this.imagesAllowed =
            resultCompanie.isSuccess && String(resultCompanie.result?.subscriptionLevel) === '2';
        } finally {
          this.loading = false;
        }
        return;
      }
      try {
        const [resultCategories, resultCompanie] = await Promise.all([
          AdminService.getCategories(this.retro.id),
          AdminService.getCompanie(),
        ]);
        if (!resultCategories.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultCategories), 'error');
          this.$emit('close');
          return;
        }
        this.imagesAllowed =
          resultCompanie.isSuccess && String(resultCompanie.result?.subscriptionLevel) === '2';
        this.form.categories = resultCategories.result.map((cat) => ({
          key: nextKey++,
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          image: cat.image || null,
          newImage: null,
          previewUrl: null,
          removeImage: false,
        }));
      } catch (err) {
        this.$root.showToast(this.$t('adminRetros.edit.loadError'), 'error');
        this.$emit('close');
      } finally {
        this.loading = false;
      }
    },
    displayedImage(cat) {
      if (cat.previewUrl) return cat.previewUrl;
      return cat.removeImage ? null : cat.image;
    },
    addCategory() {
      this.form.categories.push({
        key: nextKey++,
        id: null,
        name: '',
        description: '',
        image: null,
        newImage: null,
        previewUrl: null,
        removeImage: false,
      });
    },
    removeCategory(index) {
      this.revokePreview(this.form.categories[index]);
      this.form.categories.splice(index, 1);
    },
    selectImage(event, cat) {
      const file = event.target.files[0];
      if (!file) return;
      this.revokePreview(cat);
      cat.newImage = file;
      cat.previewUrl = URL.createObjectURL(file);
      cat.removeImage = false;
    },
    clearImage(cat) {
      if (cat.newImage) {
        // Annule simplement l'image choisie, on revient à l'image enregistrée
        this.revokePreview(cat);
        cat.newImage = null;
        return;
      }
      cat.removeImage = true;
    },
    revokePreview(cat) {
      if (cat?.previewUrl) URL.revokeObjectURL(cat.previewUrl);
      if (cat) cat.previewUrl = null;
    },
    validate() {
      const categories = this.form.categories;
      if (!this.form.name.trim()) return this.$t('adminRetros.edit.nameRequired');
      if (categories.length < 2) return this.$t('adminRetros.edit.minCategories');
      const names = categories.map((cat) => cat.name.trim().toUpperCase());
      if (names.some((name) => !name)) return this.$t('adminRetros.edit.nameRequired');
      if (new Set(names).size !== names.length) return this.$t('adminRetros.edit.duplicateNames');
      return '';
    },
    async save() {
      this.messageError = this.validate();
      if (this.messageError) return;

      const formData = new FormData();
      formData.append('name', this.form.name.trim());
      this.form.categories.forEach((cat, index) => {
        if (cat.id) formData.append(`categories[${index}][id]`, cat.id);
        formData.append(`categories[${index}][name]`, cat.name.trim());
        formData.append(`categories[${index}][description]`, cat.description.trim());
        if (cat.newImage) formData.append(`categories[${index}][image]`, cat.newImage);
        else if (cat.removeImage) formData.append(`categories[${index}][removeImage]`, '1');
      });

      this.saving = true;
      try {
        const result = this.isCreation
          ? await AdminService.createRetro(formData)
          : await AdminService.updateRetro(this.retro.id, formData);
        if (!result.isSuccess) {
          this.messageError = this.$apiMessage(result);
          return;
        }
        this.$root.showToast(
          this.isCreation
            ? this.$t('adminRetros.edit.created', { name: this.form.name.trim() })
            : this.$t('adminRetros.edit.success'),
          'success'
        );
        this.$emit('saved', result.result);
      } catch (err) {
        this.messageError = this.$apiMessage(err.response?.data);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 1.5rem 1.75rem;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #002b36;
}

.close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #555;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.close:hover {
  background: #f1ede3;
}

.message {
  background: #fdecea;
  color: #a12622;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  margin: 0 0 1rem;
}

.info {
  color: #6b7678;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.9rem;
}

.form-group label {
  margin-bottom: 0.3rem;
  font-weight: 600;
  color: #333;
}

.form-group input[type='text'] {
  padding: 0.55rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 0;
}

.form-group input[type='text']:focus {
  border-color: #002b36;
  outline: none;
  box-shadow: 0 0 4px #002b3666;
}

.section-label {
  font-size: 1.05rem;
  color: #002b36;
  margin: 1.25rem 0 0.75rem;
}

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.category-card {
  border: 1px solid #e3ddcf;
  border-radius: 12px;
  padding: 0.9rem 1rem 0.2rem;
  background: #fffcf5;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.category-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #002b36;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete {
  background-color: #dc3545;
  border: 1px solid #dc3545;
  color: #ffffff;
  border-radius: 6px;
  min-width: 40px;
  min-height: 36px;
  cursor: pointer;
}

.image-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.image-preview {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e3ddcf;
}

.no-image {
  font-size: 0.9rem;
  color: #6b7678;
}

.image-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.file-button {
  position: relative;
  overflow: hidden;
  display: inline-block;
  padding: 0.45rem 0.8rem;
  border: 1px solid #005a64;
  color: #005a64 !important;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  margin: 0 !important;
}

.file-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.link-button {
  background: none;
  border: none;
  color: #a12622;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.4rem;
}

.hint {
  font-size: 0.85rem;
  color: #6b7678;
  margin: 0.35rem 0 0;
}

.primary-btn,
.secondary-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  min-height: 40px;
  transition: background 0.2s ease;
}

.primary-btn {
  background-color: #005a64;
  border: 1px solid #005a64;
  color: #ffffff;
}

.primary-btn:hover {
  background-color: #002b36;
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.secondary-btn {
  background: #ffffff;
  border: 1px solid #005a64;
  color: #005a64;
}

.secondary-btn:hover {
  background: #e6f0f2;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1ede3;
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .modal {
    padding: 1.1rem 1rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button,
  .secondary-btn {
    width: 100%;
  }
}
</style>
