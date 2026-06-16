import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getPendingProfile } from '../utils/pendingProfileStorage';
import { mergeDoctorProfile } from '../utils/mergeDoctorProfile';

/**
 * Shared data source for DoctorPendingScreen — works for both:
 * - Auth stack instance (post-register, no Redux user)
 * - Root stack instance (post-login unapproved, Redux user present)
 */
export const usePendingDoctorDisplay = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [pendingProfile, setPendingProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getPendingProfile()
      .then((profile) => {
        if (mounted) setPendingProfile(profile);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const display = mergeDoctorProfile(user, pendingProfile);

  return {
    display,
    isLoading,
    user,
    logout,
    isAuthenticated,
  };
};
