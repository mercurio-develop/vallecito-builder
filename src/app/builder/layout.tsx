import { TripProvider } from "@/features/pro-builder/store/trip-context";
import { PreferencesProvider } from "@/features/pro-builder/store/preferences-context";

export default function ProBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreferencesProvider>
      <TripProvider>
        {children}
      </TripProvider>
    </PreferencesProvider>
  );
}
