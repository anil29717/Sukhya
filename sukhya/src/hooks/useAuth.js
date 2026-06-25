import { useDispatch, useSelector } from 'react-redux';
import { setAuth, clearAuth } from '../store/authSlice';
import { loginApi, logoutApi, getMeApi } from '../api/auth';
import { getMyDoctorProfile, updateMyDoctorProfile } from '../api/doctors';
import { getAccessToken } from '../api/client';
import { getTokenRole } from '../utils/jwt';
import { getPendingProfile, clearPendingProfile } from '../utils/pendingProfileStorage';

const syncPendingDoctorProfile = async () => {
  const pending = await getPendingProfile();
  if (!pending) return null;

  const payload = {};
  if (pending.specialization) {
    payload.specialization = pending.specialization;
  }
  if (pending.years_experience) {
    const years = parseInt(pending.years_experience, 10);
    if (!Number.isNaN(years)) payload.experience_years = years;
  }
  if (pending.consultation_fee) {
    const fee = parseFloat(pending.consultation_fee);
    if (!Number.isNaN(fee)) payload.consultation_fee = fee;
  }

  if (Object.keys(payload).length === 0) return null;

  await updateMyDoctorProfile(payload);
  return getMyDoctorProfile();
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const login = async (email, password) => {
    await loginApi(email, password);

    const token = await getAccessToken();
    const role = getTokenRole(token);
    const user = await getMeApi();

    let doctorProfile = null;
    if (role === 'doctor') {
      try {
        doctorProfile = await syncPendingDoctorProfile();
        if (!doctorProfile) {
          doctorProfile = await getMyDoctorProfile();
        }
      } catch {
        try {
          doctorProfile = await getMyDoctorProfile();
        } catch {
          // Profile may not exist yet for newly registered doctors
        }
      }
    }

    const enrichedUser = doctorProfile
      ? { ...user, doctor_profile: doctorProfile }
      : user;

    dispatch(setAuth({
      role,
      user: enrichedUser,
      isApproved: user.is_approved ?? false,
    }));

    await clearPendingProfile();

    return { role, isApproved: user.is_approved ?? false };
  };

  const logout = async () => {
    await logoutApi();
    dispatch(clearAuth());
  };

  return {
    ...auth,
    login,
    logout,
  };
};
