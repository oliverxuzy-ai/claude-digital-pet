# TODOS

## Economy Balance Testing
- **What:** 用真实Claude Code session的JSONL数据验证经济系统平衡性
- **Why:** Outside voice指出，按当前汇率(1000 tokens = 1 coin)，一次Claude回复约产出60+ coins，5分钟内就能买完商店所有物品。需要调整汇率让游戏循环有意义。
- **Pros:** 确保玩家有持续的赚金币动力，商店物品有攻略价值
- **Cons:** 需要收集真实session数据，可能需要多轮调整
- **Context:** 实现完成后，用真实JSONL文件测试：30分钟coding session应该产出足够买一个便宜物品但不够买完所有物品。汇率从10000:1开始试，根据实际体验调整。同时验证decay速率(-15 hunger/h, -10 happiness/h)是否让喂食频率合理（大约每2小时需要喂一次）。
- **Depends on:** Token monitor + economy module实现完成后
