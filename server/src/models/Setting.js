import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    key: { type: String, default: 'app', unique: true },
    appName: { type: String, default: 'APC YES, ISIALA NGWA SOUTH' },
    organisationLabel: { type: String, default: 'Isialangwa South LGA, Abia State' },
    defaultPageSize: { type: Number, default: 20, min: 10, max: 100 },
    defaultCountryCode: { type: String, default: '+234' },
    dateFormat: { type: String, enum: ['short', 'numeric'], default: 'short' },
    sessionExpiryHours: { type: Number, default: 8, min: 1, max: 72 },
    passwordMinLength: { type: Number, default: 10, min: 8, max: 64 },
    retentionMonths: { type: Number, default: 24, min: 1, max: 120 },
    consentPurpose: { type: String, default: 'Voluntary contact directory for authorised community communication' },
    privacyNotice: {
      type: String,
      default:
        'This directory stores only the contact details people have voluntarily provided: name, phone number, optional address, ward and polling unit. Records are kept only for the stated purpose, are visible only to authorised administrators, and are never used for profiling or automated bulk messaging. You may withdraw consent, correct your details or ask for deletion at any time by contacting an administrator. Processing follows the Nigeria Data Protection Act 2023.',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', schema);
