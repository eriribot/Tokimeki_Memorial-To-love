#!/bin/bash
# 立绘表情迁移快速命令参考
# 保存为 portrait-transform-quickstart.sh

set -e

echo "========================================"
echo "立绘表情迁移流水线 - 快速开始"
echo "========================================"
echo ""

# 检查当前目录
if [ ! -f "setup_new_case.py" ]; then
    echo "❌ 错误：请在 artsource/model/ 目录下运行此脚本"
    exit 1
fi

echo "可用命令："
echo ""
echo "1️⃣  初始化新案例"
echo "   python setup_new_case.py \\"
echo "     --character 角色名 \\"
echo "     --source 源姿势ID \\"
echo "     --target 目标姿势ID \\"
echo "     --expressions 表情1,表情2"
echo ""
echo "   示例："
echo "   python setup_new_case.py \\"
echo "     --character 梦梦 \\"
echo "     --source 03 \\"
echo "     --target 01 \\"
echo "     --expressions shy,smile"
echo ""

echo "2️⃣  生成转换候选"
echo "   cd cases/{角色}-{源}-to-{目标}/"
echo "   python build_target_native_feature_candidate.py"
echo ""

echo "3️⃣  打开验收界面"
echo "   # 在浏览器中打开："
echo "   http://localhost:5500/artsource/model/cases/{角色}-{源}-to-{目标}/index.html"
echo ""

echo "4️⃣  查看坐标参考"
echo "   # 在浏览器中打开："
echo "   http://localhost:5500/artsource/model/coordinate-helper.html"
echo ""

echo "5️⃣  晋升到正式素材（验收通过后）"
echo "   cd cases/{角色}-{源}-to-{目标}/outputs/target-native-features-v2/"
echo "   cp *_v2_eye.png ../../../../{角色}/{位置}_{表情}_eye.png"
echo "   cp *_v2_mouth.png ../../../../{角色}/{位置}_{表情}_mouth.png"
echo ""

echo "========================================"
echo "春菜更衣室案例 - 当前状态"
echo "========================================"
echo ""

HARUNA_CASE="cases/haruna-03-to-02"

if [ -d "$HARUNA_CASE" ]; then
    echo "✅ 案例目录存在"

    if [ -d "$HARUNA_CASE/outputs/target-native-features-v2" ]; then
        echo "✅ V2 输出已生成"

        V2_FILES=$(ls $HARUNA_CASE/outputs/target-native-features-v2/*.png 2>/dev/null | wc -l)
        echo "   找到 $V2_FILES 个输出文件"

        if [ -f "$HARUNA_CASE/acceptance-contract.json" ]; then
            PROMOTION_STATUS=$(grep -o '"promotionAllowed": [a-z]*' "$HARUNA_CASE/acceptance-contract.json" | cut -d' ' -f2)

            if [ "$PROMOTION_STATUS" = "true" ]; then
                echo "✅ 验收已通过 - 可以晋升"
            else
                echo "⏳ 待人工验收 - 需要完成 12 项审查"
                echo ""
                echo "   下一步："
                echo "   1. 打开 http://localhost:5500/artsource/model/$HARUNA_CASE/index.html"
                echo "   2. 逐帧检查 shy 和 anger 的 eyes/mouth（共 12 项）"
                echo "   3. 编辑 $HARUNA_CASE/acceptance-contract.json"
                echo "   4. 设置 promotionAllowed: true"
            fi
        fi
    else
        echo "⏳ V2 输出尚未生成"
        echo ""
        echo "   运行："
        echo "   cd $HARUNA_CASE && python build_target_native_feature_candidate.py"
    fi
else
    echo "❌ 春菜案例目录不存在"
fi

echo ""
echo "========================================"
echo "旧文件清理建议"
echo "========================================"
echo ""

OLD_FILES=(
    "../../haruna/haruna_changer_room/005_02_05_from_03_b_eye.png"
    "../../haruna/haruna_changer_room/005_02_05_from_03_b_mouth.png"
    "../../haruna/haruna_changer_room/005_02_05_from_03_c_eye.png"
    "../../haruna/haruna_changer_room/005_02_05_from_03_c_mouth.png"
)

OLD_EXISTS=0
for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        OLD_EXISTS=$((OLD_EXISTS + 1))
    fi
done

if [ $OLD_EXISTS -gt 0 ]; then
    echo "⚠️  发现 $OLD_EXISTS 个使用旧方法生成的文件"
    echo ""
    echo "   这些文件使用已否决的 body-edge-graft 方法："
    for file in "${OLD_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "   - $(basename $file)"
        fi
    done
    echo ""
    echo "   建议："
    echo "   1. 验收通过后，用 V2 输出替换"
    echo "   2. 或移到归档目录："
    echo "      mkdir -p ../../haruna/haruna_changer_room/deprecated/"
    echo "      mv ../../haruna/haruna_changer_room/005_02_05_from_03_*.png \\"
    echo "         ../../haruna/haruna_changer_room/deprecated/"
else
    echo "✅ 未发现旧方法生成的文件"
fi

echo ""
echo "========================================"
echo "文档索引"
echo "========================================"
echo ""
echo "📖 流程总结：        PIPELINE_SUMMARY.md"
echo "📖 详细教程：        .claude/skills/portrait-transform.md"
echo "📖 校准台说明：      README.md"
echo "📖 春菜案例：        cases/haruna-03-to-02/README.md"
echo ""
echo "========================================"
