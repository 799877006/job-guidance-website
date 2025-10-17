#!/bin/bash

# =====================================================
# RLS策略部署脚本
# 用于将RLS策略推送到Supabase数据库
# =====================================================

set -e  # 遇到错误时退出

echo "🚀 开始部署RLS策略到Supabase..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: 未设置DATABASE_URL环境变量"
    echo "请确保.env文件中有正确的DATABASE_URL"
    exit 1
fi

# 检查Supabase CLI是否安装
if ! command -v supabase &> /dev/null; then
    echo "❌ 错误: 未安装Supabase CLI"
    echo "请运行: npm install -g supabase"
    exit 1
fi

# 检查SQL文件是否存在
SQL_FILE="scripts/21-comprehensive-rls-policies.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 错误: 找不到SQL文件 $SQL_FILE"
    exit 1
fi

echo "📋 准备执行SQL脚本: $SQL_FILE"

# 方法1: 使用psql直接连接（推荐）
echo "🔗 使用psql连接数据库..."
psql "$DATABASE_URL" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ RLS策略部署成功！"
    echo ""
    echo "📊 验证部署结果:"
    echo "1. 检查RLS是否启用"
    echo "2. 验证策略是否正确创建"
    echo "3. 测试不同角色的访问权限"
    echo ""
    echo "🔍 可以在Supabase Dashboard中查看策略状态"
else
    echo "❌ 部署失败，请检查错误信息"
    exit 1
fi

# 方法2: 使用Supabase CLI（备选方案）
# echo "🔗 使用Supabase CLI连接..."
# supabase db reset --linked
# supabase db push

echo "🎉 部署完成！"
