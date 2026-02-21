import { trpc } from "@/lib/trpc";
import { DEFAULT_DESIGN_SETTINGS } from "../../../shared/designDefaults";
import type { DesignSettingsData } from "../../../shared/designDefaults";

/**
 * Hook to load and save design settings via tRPC.
 * Returns the current settings (or defaults), loading state, and a save function.
 */
export function useDesignSettings() {
  const { data, isLoading, error } = trpc.design.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  const utils = trpc.useUtils();

  const saveMutation = trpc.design.save.useMutation({
    onSuccess: () => {
      utils.design.get.invalidate();
    },
  });

  const uploadLogoMutation = trpc.design.uploadLogo.useMutation();

  const settings: DesignSettingsData = data ?? DEFAULT_DESIGN_SETTINGS;

  return {
    settings,
    isLoading,
    error,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    uploadLogo: uploadLogoMutation.mutateAsync,
    isUploadingLogo: uploadLogoMutation.isPending,
  };
}
