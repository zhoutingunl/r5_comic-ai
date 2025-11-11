import { useState, useEffect } from 'react';
import { Character } from '@/types';
import { getAllCharacters, deleteCharacter } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, User, ChevronRight } from 'lucide-react';
import { CharacterCreateDialog } from './character-create-dialog';

export function CharacterSidebar() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);

  // 加载角色列表
  const loadCharacters = async () => {
    try {
      const allCharacters = await getAllCharacters();
      setCharacters(allCharacters);
    } catch (error) {
      console.error('加载角色失败:', error);
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

  const toggleExpand = (characterId: string) => {
    setExpandedCharacterId(expandedCharacterId === characterId ? null : characterId);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>角色库</CardTitle>
            <CardDescription className="mt-1">
              管理角色三视图
            </CardDescription>
          </div>
          <Button size="icon" onClick={() => setIsCreateDialogOpen(true)} title="创建角色">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-3 px-4">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              还没有创建任何角色
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              创建第一个角色
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {characters.map((character) => {
              const isExpanded = expandedCharacterId === character.id;
              return (
                <Card key={character.id} className="overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => toggleExpand(character.id)}
                        className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="font-semibold text-sm truncate">
                          {character.name}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleCharacterDeleted(character.id)}
                        title="删除角色"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-2 animate-in slide-in-from-top">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {character.description}
                        </p>
                        <div className="relative rounded-lg border overflow-hidden bg-muted">
                          {character.imageUrl ? (
                            <img
                              src={character.imageUrl}
                              alt={`${character.name} - 三视图`}
                              className="w-full h-auto"
                            />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center">
                              <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          创建于 {new Date(character.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <CharacterCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCharacterCreated={handleCharacterCreated}
      />
    </Card>
  );
}
