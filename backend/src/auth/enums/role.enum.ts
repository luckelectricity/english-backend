export enum Role {
    USER = 'user',
    VIP = 'vip',
    VVIP = 'vvip',
    ADMIN = 'admin',
}

// 角色层级 (用于后续扩展)
export const ROLE_HIERARCHY = {
    user: 0,
    vip: 1,
    vvip: 2,
    admin: 3,
};
