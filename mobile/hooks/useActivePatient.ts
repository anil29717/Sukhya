import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { tokenStorage, ACTIVE_PATIENT_KEY } from '@/api/storage';
import { setActivePatient } from '@/store/authSlice';
import { RootState } from '@/store/store';

export function useActivePatient() {
  const dispatch = useDispatch();
  const { patient, activePatientId, activePatientName } = useSelector((s: RootState) => s.auth);

  const guardianPatientId = patient?.id ?? null;

  const switchToGuardian = useCallback(async () => {
    if (!patient) return;
    dispatch(setActivePatient({ patientId: patient.id, displayName: patient.user.full_name }));
    await tokenStorage.setItem(ACTIVE_PATIENT_KEY, String(patient.id));
  }, [dispatch, patient]);

  const switchToFamilyMember = useCallback(
    async (patientId: number, displayName: string) => {
      dispatch(setActivePatient({ patientId, displayName }));
      await tokenStorage.setItem(ACTIVE_PATIENT_KEY, String(patientId));
    },
    [dispatch]
  );

  return {
    guardianPatientId,
    activePatientId: activePatientId ?? guardianPatientId,
    activePatientName: activePatientName ?? patient?.user.full_name ?? 'You',
    isFamilyProfile: activePatientId !== null && activePatientId !== guardianPatientId,
    switchToGuardian,
    switchToFamilyMember,
  };
}
