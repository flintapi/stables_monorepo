

export const generateUniqueId = (prefix: string) => {
  const random = crypto.randomUUID().replace(/-/g, "").substring(prefix.length);

  return `${prefix}${random}`;
};
