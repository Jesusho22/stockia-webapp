import { Recipe } from '../domain/model/recipe.entity.js';

/**
 * Maps recipe resources of the API into domain entities and back.
 */
export class RecipeAssembler {
  /**
   * @param {Object} resource
   * @returns {Recipe}
   */
  static toEntityFromResource(resource) {
    return new Recipe({ ...resource, ingredients: resource.ingredients ?? [] });
  }

  /**
   * @param {import('axios').AxiosResponse<Object[]>} response
   * @returns {Recipe[]}
   */
  static toEntitiesFromResponse(response) {
    return (response.data ?? []).map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @param {Recipe} entity
   * @returns {Object}
   */
  static toResourceFromEntity(entity) {
    return {
      id: entity.id,
      dishName: entity.dishName,
      active: entity.active,
      ingredients: entity.ingredients.map((line) => ({ ...line })),
    };
  }
}
