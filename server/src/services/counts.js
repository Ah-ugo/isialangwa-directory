import PollingUnit from '../models/PollingUnit.js';
import Person from '../models/Person.js';

const group = (Model, field, ids) =>
  Model.aggregate([{ $match: { [field]: { $in: ids } } }, { $group: { _id: '$' + field, n: { $sum: 1 } } }]);
const toMap = (rows) => new Map(rows.map((r) => [String(r._id), r.n]));

export async function wardCounts(wardIds) {
  const [u, p] = await Promise.all([group(PollingUnit, 'wardId', wardIds), group(Person, 'wardId', wardIds)]);
  return { units: toMap(u), people: toMap(p) };
}
export async function unitPeopleCounts(unitIds) {
  return toMap(await group(Person, 'pollingUnitId', unitIds));
}
