import { useState } from 'react';
import { Scene } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SceneEditDialogProps {
  scene: Scene | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedScene: Scene) => void;
}

export function SceneEditDialog({ scene, open, onOpenChange, onSave }: SceneEditDialogProps) {
  const [editedScene, setEditedScene] = useState<Scene | null>(scene);

  // 当 scene 改变时更新 editedScene
  if (scene && editedScene?.id !== scene.id) {
    setEditedScene(scene);
  }

  if (!editedScene) return null;

  const handleSave = () => {
    onSave(editedScene);
    onOpenChange(false);
  };

  const handleCharactersChange = (value: string) => {
    const characters = value.split(',').map(c => c.trim()).filter(c => c.length > 0);
    setEditedScene({ ...editedScene, characters });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑场景 {editedScene.sceneNumber}</DialogTitle>
          <DialogDescription>
            修改场景的描述、角色、设定等信息，然后可以重新生成漫画面板
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 场景描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">场景描述</Label>
            <Textarea
              id="description"
              value={editedScene.description}
              onChange={(e) => setEditedScene({ ...editedScene, description: e.target.value })}
              placeholder="描述这个场景中发生的事情..."
              className="min-h-[100px]"
            />
          </div>

          {/* 场景设定 */}
          <div className="space-y-2">
            <Label htmlFor="setting">场景设定</Label>
            <Input
              id="setting"
              value={editedScene.setting}
              onChange={(e) => setEditedScene({ ...editedScene, setting: e.target.value })}
              placeholder="例如：夜晚的街道、豪华的宴会厅..."
            />
          </div>

          {/* 角色 */}
          <div className="space-y-2">
            <Label htmlFor="characters">角色 (用逗号分隔)</Label>
            <Input
              id="characters"
              value={editedScene.characters.join(', ')}
              onChange={(e) => handleCharactersChange(e.target.value)}
              placeholder="例如：李明, 张伟, 神秘人"
            />
            <p className="text-xs text-muted-foreground">
              多个角色请用逗号分隔
            </p>
          </div>

          {/* 情绪氛围 */}
          <div className="space-y-2">
            <Label htmlFor="mood">情绪氛围</Label>
            <Input
              id="mood"
              value={editedScene.mood}
              onChange={(e) => setEditedScene({ ...editedScene, mood: e.target.value })}
              placeholder="例如：紧张、浪漫、神秘、激动..."
            />
            <p className="text-xs text-muted-foreground">
              用一两个词描述场景的情绪氛围，如果不确定可留空
            </p>
          </div>

          {/* 对话 */}
          <div className="space-y-2">
            <Label htmlFor="dialogue">对话 (可选)</Label>
            <Textarea
              id="dialogue"
              value={editedScene.dialogue || ''}
              onChange={(e) => setEditedScene({ ...editedScene, dialogue: e.target.value })}
              placeholder="场景中的重要对话..."
              className="min-h-[60px]"
            />
          </div>

          {/* 动作 */}
          <div className="space-y-2">
            <Label htmlFor="action">动作描述</Label>
            <Textarea
              id="action"
              value={editedScene.action}
              onChange={(e) => setEditedScene({ ...editedScene, action: e.target.value })}
              placeholder="描述角色的动作和行为..."
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存更改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
