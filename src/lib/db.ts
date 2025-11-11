import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Character } from '@/types';

// 数据库 Schema 定义
interface ComicAIDB extends DBSchema {
  characters: {
    key: string;
    value: Character;
    indexes: { 
      'by-name': string;
      'by-created': Date;
    };
  };
}

const DB_NAME = 'comic-ai-db';
const DB_VERSION = 1;

// 初始化数据库
async function initDB(): Promise<IDBPDatabase<ComicAIDB>> {
  return openDB<ComicAIDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建角色表
      if (!db.objectStoreNames.contains('characters')) {
        const characterStore = db.createObjectStore('characters', {
          keyPath: 'id',
        });
        characterStore.createIndex('by-name', 'name');
        characterStore.createIndex('by-created', 'createdAt');
      }
    },
  });
}

// ==================== 角色库 CRUD 操作 ====================

/**
 * 添加角色到数据库
 */
export async function addCharacter(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
  const db = await initDB();
  const newCharacter: Character = {
    ...character,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.add('characters', newCharacter);
  return newCharacter;
}

/**
 * 获取所有角色
 */
export async function getAllCharacters(): Promise<Character[]> {
  const db = await initDB();
  return db.getAllFromIndex('characters', 'by-created');
}

/**
 * 根据 ID 获取角色
 */
export async function getCharacterById(id: string): Promise<Character | undefined> {
  const db = await initDB();
  return db.get('characters', id);
}

/**
 * 更新角色
 */
export async function updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>): Promise<Character | null> {
  const db = await initDB();
  const character = await db.get('characters', id);
  
  if (!character) {
    return null;
  }

  const updatedCharacter: Character = {
    ...character,
    ...updates,
    updatedAt: new Date(),
  };

  await db.put('characters', updatedCharacter);
  return updatedCharacter;
}

/**
 * 删除角色
 */
export async function deleteCharacter(id: string): Promise<boolean> {
  const db = await initDB();
  try {
    await db.delete('characters', id);
    return true;
  } catch (error) {
    console.error('删除角色失败:', error);
    return false;
  }
}

/**
 * 搜索角色（按名称）
 */
export async function searchCharactersByName(query: string): Promise<Character[]> {
  const db = await initDB();
  const allCharacters = await db.getAllFromIndex('characters', 'by-name');
  
  if (!query.trim()) {
    return allCharacters;
  }

  const lowerQuery = query.toLowerCase();
  return allCharacters.filter(char => 
    char.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 清空所有角色（用于测试或重置）
 */
export async function clearAllCharacters(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('characters', 'readwrite');
  await tx.objectStore('characters').clear();
  await tx.done;
}
