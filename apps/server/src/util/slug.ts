export const slugMaker = (orgName: string): string => {
    const slug = orgName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')  // remove invalid chars
        .replace(/\s+/g, '-')          // collapse whitespace
        .replace(/-+/g, '-');          // collapse dashes

    const suffix = Math.floor(100000 + Math.random() * 900000); // random 6-digit number
    return `${slug}-${suffix}`;
};
