export const homePath = () => "/";

export const loginPath = () => "/login";
export const registerPath = () => "/register";

export const dashboardTripsPath = () => "/dashboard/trips";
export const dashboardClientsPath = () => "/dashboard/clients";
export const dashboardTemplatesPath = () => "/dashboard/templates";
export const dashboardSettingsPath = () => "/dashboard/settings";
export const dashboardPlacesPath = () => "/dashboard/places";

export const builderPath = () => "/builder";

export const agencyPath = (slug: string) => `/services/agencies/${slug}`;
export const therapistPath = (slug: string) => `/services/healers/${slug}`;

export const tripPreviewPath = (token: string) => `/trip/${token}`;
export const tripConfirmPath = (token: string) => `/trip/${token}/confirm`;
export const tripDocsPath = (token: string) => `/trip/${token}/docs`;
