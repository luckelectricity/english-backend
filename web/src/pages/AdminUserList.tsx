import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface User {
    id: number
    email: string
    name: string
    role: string
    createdAt: string
    _count: {
        words: number
    }
}

interface ConfirmState {
    email: string
    newRole: string
}

export default function AdminUserList() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const data = await adminApi.getUsers()
            setUsers(data)
        } catch (error) {
            console.error('加载用户失败:', error)
            alert('加载用户列表失败')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRoleChangeRequest = (email: string, newRole: string) => {
        setConfirmState({ email, newRole })
    }

    const executeRoleChange = async () => {
        if (!confirmState) return

        const { email, newRole } = confirmState
        try {
            await adminApi.updateRole(email, newRole)
            // 乐观更新
            setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u))
            setConfirmState(null) // 关闭对话框
        } catch (error) {
            console.error('更新角色失败:', error)
            alert('更新角色失败')
        }
    }

    const getRoleBadgeClasses = (role: string) => {
        const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        switch (role) {
            case 'admin': return `${base} border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80`
            case 'vip': return `${base} border-transparent bg-primary text-primary-foreground hover:bg-primary/80`
            case 'vvip': return `${base} border-transparent bg-purple-500 text-white hover:bg-purple-600`
            default: return `${base} border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80`
        }
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">加载中...</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
                <p className="text-muted-foreground">管理系统用户及其权限角色</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>用户列表 ({users.length})</CardTitle>
                    <CardDescription>您可以直接在表格中修改用户角色</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>用户</TableHead>
                                <TableHead>单词数</TableHead>
                                <TableHead>注册时间</TableHead>
                                <TableHead>当前角色</TableHead>
                                <TableHead>操作 (修改角色)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user._count?.words || 0}</TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                                    <TableCell>
                                        <div className={getRoleBadgeClasses(user.role)}>
                                            {user.role}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[120px]"
                                            value={user.role}
                                            onChange={(e) => handleRoleChangeRequest(user.email, e.target.value)}
                                        >
                                            <option value="user">User</option>
                                            <option value="vip">VIP</option>
                                            <option value="vvip">VVIP</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!confirmState} onOpenChange={(open) => !open && setConfirmState(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认修改角色</DialogTitle>
                        <DialogDescription>
                            您确定要将用户 {confirmState?.email} 的角色修改为 <strong>{confirmState?.newRole}</strong> 吗？
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmState(null)}>取消</Button>
                        <Button onClick={executeRoleChange}>确认修改</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
