import { useState, useEffect } from 'react';
import { Character } from '@/types';
import { getAllCharacters, deleteCharacter } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, User } from 'lucide-react';
import { CharacterCreateDialog } from './character-create-dialog';

export function CharacterLibrary() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载角色列表
  const loadCharacters = async () => {
    try {
      const allCharacters = await getAllCharacters();
      setCharacters(allCharacters);
    } catch (error) {
      console.error('加载角色失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadCharacters();
  }, []);

  // 处理角色创建
  const handleCharacterCreated = (character: Character) => {
    setCharacters(prev => [...prev, character]);
  };

  // 处理角色删除
  const handleCharacterDeleted = async (characterId: string) => {
    if (!confirm('确定要删除这个角色吗？此操作无法撤销。')) {
      return;
    }

    const success = await deleteCharacter(characterId);
    if (success) {
      setCharacters(prev => prev.filter(c => c.id !== characterId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">加载角色库中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">角色库</h2>
          <p className="text-muted-foreground">
            创建和管理您的角色，每个角色包含正面、侧面、背面三视图
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          创建角色
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              还没有创建任何角色
              <br />
              点击&ldquo;创建角色&rdquo;按钮开始创建第一个角色
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建角色
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Card key={character.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{character.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {character.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleCharacterDeleted(character.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative rounded-lg border overflow-hidden bg-muted w-full max-h-96">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={`${character.name} - 三视图`}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    创建于 {new Date(character.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CharacterCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCharacterCreated={handleCharacterCreated}
      />
    </div>
  );
}
