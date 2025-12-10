#!/bin/bash
# Cloudflare IP 白名单配置脚本

echo "🔒 配置 Cloudflare IP 白名单..."

# 清除现有的 3000 端口规则
echo "清除现有规则..."
sudo ufw delete allow 3000/tcp 2>/dev/null || true

# 获取 Cloudflare IPv4 列表
echo "获取 Cloudflare IP 列表..."
CF_IPS_V4=$(curl -s https://www.cloudflare.com/ips-v4)

if [ -z "$CF_IPS_V4" ]; then
    echo "❌ 无法获取 Cloudflare IP 列表"
    exit 1
fi

# 添加 Cloudflare IP 白名单
echo "添加 Cloudflare IP 白名单..."
for ip in $CF_IPS_V4; do
    sudo ufw allow from $ip to any port 3000 proto tcp comment "Cloudflare"
    echo "  ✓ 已添加: $ip"
done

# 重新加载防火墙
sudo ufw reload

echo ""
echo "✅ Cloudflare IP 白名单配置完成!"
echo ""
echo "当前规则:"
sudo ufw status numbered | grep 3000
