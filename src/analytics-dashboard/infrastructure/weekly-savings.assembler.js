import { WeeklySavings } from '../domain/model/weekly-save.entity.js';

export class WeeklySavingsAssembler {
    static toEntityFromResource(resource) {
        const lines = (list) => (list ?? []).map((line) => ({ ...line, quantity: Number(line.quantity), value: Number(line.value) }));
        return new WeeklySavings({ ...resource, topRescued: lines(resource.topRescued), wasted: lines(resource.wasted) });
    }
}