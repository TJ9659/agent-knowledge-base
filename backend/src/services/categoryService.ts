import { categoryRepository } from '../repositories/categoryRepository.js';
import type { CategoryInput } from '../schemas/category.schemas.js';
import { HttpError } from '../utils/HttpError.js';

async function getOrThrow(id: number) {
  const category = await categoryRepository.findById(id);
  if (!category) throw HttpError.notFound('Category not found');
  return category;
}

export const categoryService = {
  list() {
    return categoryRepository.listWithCounts();
  },

  async create({ name }: CategoryInput) {
    if (await categoryRepository.existsByName(name)) {
      throw HttpError.conflict('Category name is already in use');
    }
    return categoryRepository.create(name);
  },

  async update(id: number, { name }: CategoryInput) {
    await getOrThrow(id);
    if (await categoryRepository.existsByName(name, id)) {
      throw HttpError.conflict('Category name is already in use');
    }
    return categoryRepository.update(id, name);
  },

  // drafts count too, deleting would orphan them
  async remove(id: number) {
    await getOrThrow(id);
    const count = await categoryRepository.countArticles(id);
    if (count > 0) {
      throw HttpError.conflict(`Category still has ${count} article${count === 1 ? '' : 's'}`);
    }
    await categoryRepository.delete(id);
  },
};
