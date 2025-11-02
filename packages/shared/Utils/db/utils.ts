export const generateUniqueId = (prefix: string) => {
  const random = crypto.randomUUID().replace(/-/g, "").substring(prefix.length);

  return `${prefix}${random}`;
};

export const generateWebhookSecret = (organizationId: string) => {
  const prefix = "whs_";
  const random = crypto.randomUUID().replace(/-/g, "").substring(prefix.length);

  return `${prefix}${random}`;
};
