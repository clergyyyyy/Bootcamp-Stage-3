'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader } from 'lucide-react';
import Portal from './Portal';
import Image from 'next/image';

interface ObjektNFT {
  name: string;
  image: string;
  id: string;
}

interface RawToken {
  token: {
    tokenId: string;
    name: string;
    image: string;
  };
}

interface ObjektQueryCardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedObjekts: ObjektNFT[]) => void;
  initialSelected?: ObjektNFT[];
}

const FILTERED_NFT_TITLES = [
  'tripleS',
  'ARTMS',
];

const shouldFilterNFT = (nftName: string): boolean => {
  return FILTERED_NFT_TITLES.some(filteredTitle => 
    nftName.trim() === filteredTitle
  );
};

export default function ObjektQueryCard({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialSelected = [] 
}: ObjektQueryCardProps) {
  const [objektSearch, setObjektSearch] = useState('');
  const [objektNFTs, setObjektNFTs] = useState<ObjektNFT[]>([]);
  const [objektLoading, setObjektLoading] = useState(false);
  const [objektHasMore, setObjektHasMore] = useState(true);
  const [selectedObjekts, setSelectedObjekts] = useState<ObjektNFT[]>(initialSelected);
  const [continuation, setContinuation] = useState<string | null>(null);
  
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedObjekts(initialSelected);
    }
  }, [isOpen, initialSelected]);

  // 搜尋 Objekt NFTs
  const searchObjekts = async (nickname: string, continuationToken: string | null = null) => {
    setObjektLoading(true);
    try {
      // Step 1: 獲取錢包地址
      const walletResponse = await fetch(`https://api.cosmo.fans/user/v1/by-nickname/${nickname}`);
      if (!walletResponse.ok) {
        throw new Error('無法取得錢包地址');
      }
      const walletData = await walletResponse.json();
      const walletAddress = walletData.profile.address;

      // Step 2: 構建 API URL，continuation params 加載 (not offset)
      const params = new URLSearchParams({
        limit: '20',
        ...(continuationToken && { continuation: continuationToken }),
      });
      
      const apiUrl = `https://api-mainnet.magiceden.dev/v3/rtp/abstract/users/${walletAddress}/tokens/v7?${params}`;
      console.log('🔍 API 請求 URL:', apiUrl);

      // Step 3: 獲取 NFT 資料
      const nftResponse = await fetch(apiUrl, {
        headers: {
          accept: '*/*',
        },
      });

      if (!nftResponse.ok) {
        throw new Error('無法取得 NFT 資料');
      }

      const nftData = await nftResponse.json();
      const tokens = nftData.tokens || [];
      const nextContinuation = nftData.continuation || null;
      
      console.log('📦 API 回應資料:', {
        tokensCount: tokens.length,
        continuation: nftData.continuation,
        hasMore: !!nextContinuation,
      });

      // Step 4: 處理並過濾 NFT 資料
      const processedNFTs: ObjektNFT[] = tokens
        .map((t: RawToken) => ({
        id: t.token.tokenId,
        name: t.token.name,
        image: t.token.image,
      }))
        .filter((nft: ObjektNFT) => {
          // 基本驗證：必須有 name 和 image
          if (!nft.name || !nft.image) {
            console.log('🚫 過濾掉無效 NFT (缺少 name 或 image):', nft);
            return false;
          }
          
          // 檢查是否在過濾列表中
          if (shouldFilterNFT(nft.name)) {
            console.log('🚫 過濾掉標題匹配的 NFT:', nft.name);
            return false;
          }
          
          return true;
        });

      console.log('✅ 處理後的有效 NFT:', {
        originalCount: tokens.length,
        filteredCount: processedNFTs.length,
        filtered: processedNFTs.map(nft => nft.name),
      });

      // Step 5: 更新狀態
      if (continuationToken === null) {
        // 首次載入：重置列表
        setObjektNFTs(processedNFTs);
      } else {
        // 載入更多：追加到現有列表
        setObjektNFTs(prev => [...prev, ...processedNFTs]);
      }

      // 更新分頁狀態
      setContinuation(nextContinuation);
      setObjektHasMore(!!nextContinuation);

    } catch (error) {
      console.error('搜尋 Objekt 失敗:', error);
      alert('搜尋失敗，請檢查用戶名稱是否正確');
    } finally {
      setObjektLoading(false);
    }
  };

  // 載入更多 Objekts - 使用 useCallback 並移到 useEffect 之前
  const loadMoreObjekts = useCallback(() => {
    if (objektLoading || !objektHasMore || !objektSearch.trim() || !continuation) return;
    console.log('🔄 自動載入更多 Objekts...');
    searchObjekts(objektSearch.trim(), continuation);
  }, [objektLoading, objektHasMore, objektSearch, continuation]);

  // 設置 Intersection Observer 用於自動載入
  useEffect(() => {
    if (!isOpen || !resultsContainerRef.current) return;

    const container = resultsContainerRef.current;
    
    const createTriggerElement = () => {
      const existingTrigger = container.querySelector('[data-load-trigger]');
      if (existingTrigger) {
        existingTrigger.remove();
      }

      const trigger = document.createElement('div');
      trigger.setAttribute('data-load-trigger', 'true');
      trigger.style.position = 'absolute';
      trigger.style.bottom = '15%';
      trigger.style.height = '1px';
      trigger.style.width = '100%';
      trigger.style.pointerEvents = 'none';
      trigger.style.visibility = 'hidden';
      
      container.style.position = 'relative';
      container.appendChild(trigger);
      
      return trigger;
    };

    // 設置 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          console.log('📍 觸發自動載入 (滾動到85%位置)');
          loadMoreObjekts();
        }
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (objektNFTs.length > 0 && objektHasMore && continuation) {
      const trigger = createTriggerElement();
      observer.observe(trigger);
      
      // 清理函數
      return () => {
        observer.disconnect();
        const existingTrigger = container.querySelector('[data-load-trigger]');
        if (existingTrigger) {
          existingTrigger.remove();
        }
      };
    }

    return () => observer.disconnect();
  }, [isOpen, objektNFTs.length, objektHasMore, continuation, loadMoreObjekts]);

  const handleObjektSearch = () => {
    if (!objektSearch.trim()) return;
    setContinuation(null); // 重置 continuation
    setObjektNFTs([]);     // 清空現有結果
    setObjektHasMore(true);
    searchObjekts(objektSearch.trim(), null);
  };

  // 切換 Objekt 選擇狀態
  const toggleObjektSelection = (objekt: ObjektNFT) => {
    setSelectedObjekts(prev => {
      const isSelected = prev.some(item => item.id === objekt.id);
      if (isSelected) {
        return prev.filter(item => item.id !== objekt.id);
      } else {
        return [...prev, objekt];
      }
    });
  };

  // 處理關閉
  const handleClose = () => {
    // 重置所有狀態
    setObjektSearch('');
    setObjektNFTs([]);
    setContinuation(null); // 重置 continuation
    setObjektHasMore(true);
    setSelectedObjekts([]);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(selectedObjekts);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-md flex items-center justify-center z-[9999] transition-opacity duration-300"
        onClick={handleClose}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl w-[60%] h-[80%] flex flex-col transition-all duration-300 transform"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 頂部搜尋列 - 取代原本的標題列 */}
          <div className="flex items-center gap-3 p-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="輸入 COSMO 用戶名稱..."
                value={objektSearch}
                onChange={(e) => setObjektSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleObjektSearch()}
                className="w-full border border-gray-300 px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
              />
              <button
                onClick={handleObjektSearch}
                disabled={!objektSearch.trim() || objektLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 !text-gray-400 hover:text-blue-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {objektLoading ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <Search size={20} />
                )}
              </button>
            </div>
            <button
              onClick={handleClose}
              className="!text-gray-600 hover:text-gray-700 transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* NFT 結果區域 with 漸層遮罩 */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
            
            <div 
              ref={resultsContainerRef}
              className="h-full overflow-y-auto p-6 pt-4 pb-4"
            >
              {objektNFTs.length === 0 && !objektLoading ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>Enter an username to find his/her Objekt, try: yangverse</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {objektNFTs.map((objekt) => {
                    const isSelected = selectedObjekts.some(item => item.id === objekt.id);
                    return (
                      <div
                        key={objekt.id}
                        onClick={() => toggleObjektSelection(objekt)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={objekt.image}
                          alt={objekt.name}
                          width={300} 
                          height={300}
                          className="w-full aspect-square object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.png';
                          }}
                        />
                        <div className="p-2">
                          <p className="text-xs text-gray-600 truncate" title={objekt.name}>
                            {objekt.name}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 載入狀態指示器 */}
              {objektNFTs.length > 0 && objektHasMore && objektLoading && (
                <div className="text-center mt-6 p-4">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Loader className="animate-spin" size={16} />
                    <span className="text-sm">Loading More Objekt...</span>
                  </div>
                </div>
              )}

              {objektNFTs.length > 0 && !objektHasMore && (
                <div className="text-center mt-6 p-4">
                  <div className="text-sm text-gray-500">
                    🎉 Load All Objekt NFT
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 模態框底部操作區 */}
          <div className="p-6 bg-gray-50 rounded-b-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Select {selectedObjekts.length} Objekts
              </span>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 !text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedObjekts.length === 0}
                  className="px-4 py-2 bg-blue-600 text-gray-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add NFTs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}