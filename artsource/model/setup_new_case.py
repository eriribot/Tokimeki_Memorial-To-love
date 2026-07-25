#!/usr/bin/env python3
"""
立绘表情迁移案例初始化脚本

用法:
    python setup_new_case.py --character haruna --source 03 --target 02 --expressions shy,anger
"""

import argparse
import json
import csv
from pathlib import Path
from typing import Dict, List, Optional


def load_coordinate_map(csv_path: Path) -> Dict[str, Dict]:
    """从 CSV 加载坐标映射"""
    coordinates = {}

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            position_key = row['position_key']
            coordinates[position_key] = {
                'character_id': row['character_id'],
                'character_name': row['character_name'],
                'canvas': {
                    'width': int(row['canvas_width']),
                    'height': int(row['canvas_height'])
                },
                'regions': {
                    'eyes': {
                        'x': int(row['eye_x']),
                        'y': int(row['eye_y']),
                        'width': int(row['eye_width']),
                        'height': int(row['eye_height'])
                    },
                    'mouth': {
                        'x': int(row['mouth_x']),
                        'y': int(row['mouth_y']),
                        'width': int(row['mouth_width']),
                        'height': int(row['mouth_height'])
                    }
                },
                'frame_count': int(row['frame_count']) if row['frame_count'] else 3,
                'coordinate_status': row['coordinate_status']
            }

    return coordinates


def find_character_coordinates(
    coordinates: Dict[str, Dict],
    character: str,
    pose: str
) -> Optional[Dict]:
    """查找角色特定姿势的坐标"""
    # 尝试多种匹配模式
    for key, data in coordinates.items():
        char_id = data['character_id']
        char_name = data['character_name'].lower()

        # 按 position_key 匹配
        if key.startswith(f"{char_id}_{pose}"):
            return data

        # 按角色名匹配
        if character.lower() in char_name and pose in key:
            return data

    return None


def create_case_config(
    character_id: str,
    character_name: str,
    source_pose: str,
    target_pose: str,
    expressions: List[str]
) -> Dict:
    """创建案例配置"""

    # 生成表情映射（默认使用字母序列）
    expression_letters = ['a', 'b', 'c', 'd', 'e', 'f']
    expression_mapping = {}

    for i, expr in enumerate(expressions):
        if i < len(expression_letters):
            expression_mapping[expr] = expression_letters[i + 1]  # 从 'b' 开始

    return {
        "schemaVersion": 1,
        "character": {
            "id": character_id,
            "name": character_name,
            "displayName": character_name
        },
        "source": {
            "poseId": source_pose,
            "positionKey": f"{character_id}_{source_pose}"
        },
        "target": {
            "poseId": target_pose,
            "positionKey": f"{character_id}_{target_pose}"
        },
        "expressions": expressions,
        "expressionMapping": expression_mapping
    }


def create_target_native_feature_config(
    canvas: Dict,
    regions: Dict,
    frame_count: int
) -> Dict:
    """创建目标原生特征配置"""
    return {
        "schemaVersion": 2,
        "operation": "target-native-features",
        "description": "使用目标原生脸片，只迁移源表情的稀疏特征",
        "canvas": canvas,
        "regions": regions,
        "frameCount": frame_count,
        "targetNativeFeatures": {
            "useTargetEyeBase": True,
            "useTargetMouthBase": True,
            "clearTargetOldFeatures": True,
            "importSourceFeatures": {
                "eyebrowLines": True,
                "eyeDetails": True,
                "sweatDrops": True,
                "mouthCore": True,
                "mouthCoreMethod": "center-connected-v2"
            }
        },
        "mouthCoreV2": {
            "estimateLocalSkinTone": True,
            "requireCenterConnection": True,
            "rejectBoundaryTouching": True,
            "description": "排除 ROI 外圈肤色，只保留与中心种子相交且不接触边界的连通域"
        }
    }


def create_acceptance_contract(expressions: List[str]) -> Dict:
    """创建验收合同模板"""
    items = {}

    for expr in expressions:
        for frame in range(3):
            items[f"{expr}_frame{frame}_eyes"] = {
                "status": "pending",
                "notes": ""
            }
            items[f"{expr}_frame{frame}_mouth"] = {
                "status": "pending",
                "notes": ""
            }

    return {
        "schemaVersion": 1,
        "reviewDate": None,
        "reviewer": None,
        "formula": "target_native_features_v2",
        "items": items,
        "overallStatus": "pending",
        "promotionAllowed": False
    }


def create_readme(
    character_name: str,
    source_pose: str,
    target_pose: str,
    expressions: List[str]
) -> str:
    """创建 README 文档"""
    expr_list = "、".join(expressions)

    return f"""# {character_name} {source_pose} → {target_pose} 表情迁移

## 目标

将 {source_pose} 姿势的 {expr_list} 表情迁移到 {target_pose} 姿势。

## 状态

- [ ] 素材准备完成
- [ ] 配置文件创建
- [ ] Python 脚本运行
- [ ] 人工验收（{len(expressions) * 6} 项）
- [ ] 晋升到正式素材

## 文件清单

### 配置文件
- `case-config.json` - 案例基本信息
- `target-native-feature-config.json` - 转换算法参数
- `acceptance-contract.json` - 人工验收记录

### 需要准备的素材
- `../../{character_name}/{character_name}_{source_pose}_*.png` - 源姿势素材
- `../../{character_name}/{character_name}_{target_pose}_*.png` - 目标姿势素材

### 运行脚本
```bash
python build_target_native_feature_candidate.py
```

### 验收流程
1. 打开 `index.html` 查看结果
2. 逐帧检查每个表情的 eyes 和 mouth
3. 更新 `acceptance-contract.json` 中的状态
4. 所有项目通过后设置 `promotionAllowed: true`

## 质量检查点

### Eyes（每个表情 × 每帧 = {len(expressions) * 3} 项）
- [ ] 眉眼线稿完整性
- [ ] 眼神正确性
- [ ] 刘海无损坏
- [ ] 额头接缝自然
- [ ] 汗滴位置正确
- [ ] 与目标脸型协调

### Mouth（每个表情 × 每帧 = {len(expressions) * 3} 项）
- [ ] 嘴型正确性
- [ ] 嘴芯色彩准确
- [ ] 脸颊无源姿势肤色
- [ ] 下巴无损坏
- [ ] 鼻唇沟接缝自然
- [ ] 与目标脸型协调

## 输出文件

成功后会在 `outputs/target-native-features-v2/` 生成：
{chr(10).join([f"- `{character_name}_{target_pose}_from_{source_pose}_{expr}_*.png`" for expr in expressions])}

## 晋升命名

晋升到正式素材时使用语义化命名：
{chr(10).join([f"- `{character_name}_{{location}}_{expr}_eye.png`" for expr in expressions])}
{chr(10).join([f"- `{character_name}_{{location}}_{expr}_mouth.png`" for expr in expressions])}
"""


def main():
    parser = argparse.ArgumentParser(description='初始化立绘表情迁移案例')
    parser.add_argument('--character', required=True, help='角色名（中文）或 ID')
    parser.add_argument('--source', required=True, help='源姿势 ID（如 03）')
    parser.add_argument('--target', required=True, help='目标姿势 ID（如 02）')
    parser.add_argument('--expressions', required=True, help='表情列表，逗号分隔（如 shy,anger）')
    parser.add_argument('--csv', default='./official-face-coordinate-map.csv', help='坐标 CSV 文件路径')

    args = parser.parse_args()

    # 解析参数
    expressions = [e.strip() for e in args.expressions.split(',')]
    csv_path = Path(args.csv)

    # 加载坐标数据
    print(f"📖 加载坐标数据：{csv_path}")
    coordinates = load_coordinate_map(csv_path)

    # 查找源和目标坐标
    print(f"🔍 查找 {args.character} 的坐标...")
    source_coords = find_character_coordinates(coordinates, args.character, args.source)
    target_coords = find_character_coordinates(coordinates, args.character, args.target)

    if not source_coords:
        print(f"❌ 未找到源姿势 {args.source} 的坐标")
        return

    if not target_coords:
        print(f"❌ 未找到目标姿势 {args.target} 的坐标")
        return

    character_id = source_coords['character_id']
    character_name = source_coords['character_name']

    print(f"✅ 找到角色：{character_name} (ID: {character_id})")

    # 创建案例目录
    case_dir = Path(f"cases/{character_name}-{args.source}-to-{args.target}")
    case_dir.mkdir(parents=True, exist_ok=True)
    print(f"📁 创建案例目录：{case_dir}")

    # 创建子目录
    (case_dir / "assets").mkdir(exist_ok=True)
    (case_dir / "outputs").mkdir(exist_ok=True)

    # 生成配置文件
    print("📝 生成配置文件...")

    # 1. case-config.json
    case_config = create_case_config(
        character_id,
        character_name,
        args.source,
        args.target,
        expressions
    )

    with open(case_dir / "case-config.json", 'w', encoding='utf-8') as f:
        json.dump(case_config, f, indent=2, ensure_ascii=False)
    print("  ✓ case-config.json")

    # 2. target-native-feature-config.json
    target_config = create_target_native_feature_config(
        target_coords['canvas'],
        target_coords['regions'],
        target_coords['frame_count']
    )

    with open(case_dir / "target-native-feature-config.json", 'w', encoding='utf-8') as f:
        json.dump(target_config, f, indent=2, ensure_ascii=False)
    print("  ✓ target-native-feature-config.json")

    # 3. acceptance-contract.json
    acceptance_contract = create_acceptance_contract(expressions)

    with open(case_dir / "acceptance-contract.json", 'w', encoding='utf-8') as f:
        json.dump(acceptance_contract, f, indent=2, ensure_ascii=False)
    print("  ✓ acceptance-contract.json")

    # 4. README.md
    readme_content = create_readme(
        character_name,
        args.source,
        args.target,
        expressions
    )

    with open(case_dir / "README.md", 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("  ✓ README.md")

    # 打印下一步操作
    print("\n" + "="*60)
    print("🎉 案例初始化完成！")
    print("="*60)
    print("\n📋 下一步操作：\n")
    print(f"1. 进入案例目录：")
    print(f"   cd {case_dir}\n")
    print(f"2. 准备素材文件（或确认已存在）：")
    print(f"   - ../../{character_name}/{character_name}_{args.source}_*.png")
    print(f"   - ../../{character_name}/{character_name}_{args.target}_*.png\n")
    print(f"3. 运行转换脚本：")
    print(f"   python build_target_native_feature_candidate.py\n")
    print(f"4. 在浏览器中打开验收页面：")
    print(f"   http://localhost:5500/artsource/model/{case_dir}/index.html\n")
    print(f"5. 完成 {len(expressions) * 6} 项人工验收")
    print(f"6. 更新 acceptance-contract.json")
    print(f"7. 晋升到正式素材目录\n")

    print("📖 详细文档请查看：")
    print("   .claude/skills/portrait-transform.md\n")


if __name__ == '__main__':
    main()
