const FALLBACK = 'Not provided';

/**
 * Merge Redux user + doctor_profile with AsyncStorage pending profile.
 * Used by DoctorPendingScreen in both Auth stack (post-register) and
 * root stack (post-login unapproved).
 */
export const mergeDoctorProfile = (user, pendingProfile) => {
  const doctorProfile = user?.doctor_profile ?? null;

  const experienceYears =
    doctorProfile?.experience_years ?? pendingProfile?.years_experience ?? null;

  return {
    fullName: user?.full_name ?? pendingProfile?.full_name ?? 'Doctor',
    email: user?.email ?? pendingProfile?.email ?? '—',
    specialization:
      doctorProfile?.specialization ?? pendingProfile?.specialization ?? FALLBACK,
    hospital:
      pendingProfile?.hospital_name ?? doctorProfile?.hospital_name ?? FALLBACK,
    licenseNumber:
      pendingProfile?.license_number ?? doctorProfile?.license_number ?? FALLBACK,
    experience: experienceYears ? `${experienceYears} years` : FALLBACK,
    consultationFee:
      doctorProfile?.consultation_fee ?? pendingProfile?.consultation_fee ?? null,
  };
};
