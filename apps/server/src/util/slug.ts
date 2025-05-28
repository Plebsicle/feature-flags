export const slugMaker = (orgName : string) : string => {
    const  slug = orgName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const suffix = Math.random.toString().substring(2,8);
    return `${slug}-${suffix}`;
}