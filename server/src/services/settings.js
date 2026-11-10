import Setting from '../models/Setting.js';

export async function getSettings() {
  const settings = await Setting.findOneAndUpdate({ key: 'app' }, { $setOnInsert: { key: 'app' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  if (settings.appName === 'Isialangwa South Directory') {
    settings.appName = 'APC YES, ISIALA NGWA SOUTH';
    await settings.save();
  }
  return settings;
}
