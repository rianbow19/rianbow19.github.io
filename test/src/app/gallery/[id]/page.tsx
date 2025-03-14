"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// 模擬資料：藝術作品
const artworks = [
  {
    id: 1,
    title: "彩色幻想",
    description: "抽象表現主義，展現色彩的張力與活力",
    fullDescription:
      "這件作品通過豐富的色彩和流動的形式探索情感的複雜性。我使用了多層次的壓克力顏料，創造出深度和質感，邀請觀眾沉浸在色彩的海洋中。每一筆觸都是情感的直接表達，沒有預設的計劃，而是讓創作過程本身引導作品的發展。這種自由流動的創作方式反映了生活中的不可預測性和變化的美。",
    category: "抽象",
    image: "https://source.unsplash.com/random/1200x800/?abstract,painting",
    year: 2023,
    dimensions: "100 x 120 cm",
    medium: "壓克力顏料、畫布",
    location: "台北現代美術館",
    relatedWorks: [2, 6, 8],
  },
  {
    id: 2,
    title: "靈魂之窗",
    description: "現代人像藝術，探索人類情感與內心世界",
    fullDescription:
      "這幅肖像畫嘗試捕捉人類情感的深度和複雜性。通過對光影的精細處理和表情的微妙描繪，我希望能夠揭示被描繪者內心的情感狀態。眼睛被特意強調，因為它們確實是心靈的窗戶，透露出深層次的情感和經歷。每一處細節都經過精心刻畫，旨在創造一個能與觀眾建立情感連結的形象。",
    category: "人像",
    image: "https://source.unsplash.com/random/1200x800/?portrait,art",
    year: 2022,
    dimensions: "80 x 100 cm",
    medium: "油彩、畫布",
    location: "私人收藏",
    relatedWorks: [1, 7, 9],
  },
  {
    id: 3,
    title: "自然詩篇",
    description: "當代風景畫，呈現大自然的壯麗與寧靜",
    fullDescription:
      "這幅風景畫捕捉了黎明時分的寧靜時刻，當陽光首次觸及山峰，在山谷中創造出神奇的光影效果。我特別關注色彩的微妙變化和光線如何塑造景觀。通過多層次的薄塗技法，我試圖捕捉光線穿過霧氣的瞬間效果，創造出一種夢幻般的氛圍，同時保持景觀的真實感。這幅作品是對自然之美的致敬，也是對時間短暫性的一種冥想。",
    category: "風景",
    image: "https://source.unsplash.com/random/1200x800/?landscape,painting",
    year: 2023,
    dimensions: "90 x 120 cm",
    medium: "油彩、畫布",
    location: "高雄藝術博物館",
    relatedWorks: [4, 5, 9],
  },
  {
    id: 4,
    title: "城市脈動",
    description: "都市景觀，捕捉城市的節奏與能量",
    fullDescription:
      "這幅城市景觀作品致力於捕捉現代都市生活的活力與能量。我使用了大膽的筆觸和鮮明的色彩對比，創造出城市中光與影的動態遊戲。作品包含了許多細節，展示了城市生活的多層面性 - 從高聳的摩天大樓到忙碌的街道，從公共空間到私人角落。透過半抽象的表現手法，我希望能夠表達出城市環境的節奏感和不斷變化的特性。",
    category: "風景",
    image: "https://source.unsplash.com/random/1200x800/?cityscape,art",
    year: 2021,
    dimensions: "100 x 150 cm",
    medium: "混合媒材、畫布",
    location: "台北市立美術館",
    relatedWorks: [3, 6, 8],
  },
  {
    id: 5,
    title: "靜物思考",
    description: "當代靜物畫，探索物體與空間的關係",
    fullDescription:
      "這幅靜物畫探索了日常物品的美學和象徵意義。我特意選擇了具有豐富紋理和形式的物體，通過精心的安排和微妙的光線處理，賦予它們新的意義。作品中的每個物體都象徵著生活的不同方面，它們之間的關係和空間的利用則反映了人際關係和社會結構。我運用了傳統的靜物畫技法，同時融入了現代的視角和理解。",
    category: "靜物",
    image: "https://source.unsplash.com/random/1200x800/?stilllife,art",
    year: 2022,
    dimensions: "60 x 80 cm",
    medium: "油彩、木板",
    location: "台中藝術中心",
    relatedWorks: [3, 7, 9],
  },
  {
    id: 6,
    title: "夢境遊戲",
    description: "超現實主義作品，打破現實與夢境的界限",
    fullDescription:
      "這件超現實主義作品探索了潛意識世界和夢境的奇妙景象。我將不相關的元素並置在一起，創造出一個既熟悉又陌生的世界，挑戰觀眾的現實認知。作品中充滿了象徵性的圖像和隱喻，邀請觀眾進行自己的解讀和探索。色彩的選擇和構圖的安排都經過精心考慮，旨在創造一種夢幻的氛圍，同時保持視覺的連貫性和吸引力。",
    category: "超現實",
    image: "https://source.unsplash.com/random/1200x800/?surreal,art",
    year: 2023,
    dimensions: "120 x 150 cm",
    medium: "油彩、畫布",
    location: "台南藝術博物館",
    relatedWorks: [1, 4, 8],
  },
  {
    id: 7,
    title: "情緒波瀾",
    description: "表現主義作品，強烈表達內心情感",
    fullDescription:
      "這幅表現主義作品是對強烈情感狀態的視覺探索。我使用了大膽、誇張的筆觸和鮮明的色彩對比，直接從內心表達出原始的情感能量。作品中扭曲的形體和強烈的顏色不追求真實再現，而是通過視覺元素的情感力量來傳達內心體驗的強度。這是一次將無形的感受轉化為有形視覺語言的嘗試，邀請觀眾共鳴並反思自己的情感經歷。",
    category: "表現",
    image: "https://source.unsplash.com/random/1200x800/?expressionism,art",
    year: 2021,
    dimensions: "90 x 110 cm",
    medium: "油彩、畫布",
    location: "新竹美術館",
    relatedWorks: [2, 5, 9],
  },
  {
    id: 8,
    title: "數位未來",
    description: "數位藝術，探索科技與藝術的融合",
    fullDescription:
      "這件數位藝術作品探索了科技與藝術的交匯點。我運用了演算法和數位工具來創造出傳統媒介難以實現的視覺效果。作品中流動的形式和變化的色彩模擬了自然界中的有機生長和變化過程，同時帶有明顯的技術痕跡。這種融合反映了我們當代生活中自然與人工的共存關係，以及科技如何改變我們感知和創造美的方式。",
    category: "數位",
    image: "https://source.unsplash.com/random/1200x800/?digital,art",
    year: 2023,
    dimensions: "變動尺寸",
    medium: "數位媒體",
    location: "線上藝廊",
    relatedWorks: [1, 4, 6],
  },
  {
    id: 9,
    title: "古典回響",
    description: "新古典主義作品，向傳統藝術致敬",
    fullDescription:
      "這幅新古典主義風格的作品是對傳統藝術語言的當代詮釋。我研究了文藝復興和巴洛克時期的技法和美學原則，並將其應用於當代主題。作品中精細的筆觸、嚴謹的構圖和精心處理的明暗對比，都反映了對古典繪畫傳統的敬意。然而，主題和某些形式元素的處理則帶有現代感，創造出一種跨越時空的對話，思考藝術傳統在當代語境中的意義和價值。",
    category: "古典",
    image: "https://source.unsplash.com/random/1200x800/?classic,art",
    year: 2022,
    dimensions: "100 x 120 cm",
    medium: "油彩、畫布",
    location: "嘉義美術館",
    relatedWorks: [2, 3, 5],
  },
];

export default function ArtworkDetail() {
  const router = useRouter();
  const params = useParams();
  const [artwork, setArtwork] = useState<(typeof artworks)[0] | null>(null);
  const [relatedArtworks, setRelatedArtworks] = useState<typeof artworks>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      // 模擬API調用
      const id = parseInt(params.id as string);
      const foundArtwork = artworks.find((art) => art.id === id);

      if (foundArtwork) {
        setArtwork(foundArtwork);

        // 獲取相關作品
        if (foundArtwork.relatedWorks) {
          const related = artworks.filter((art) => foundArtwork.relatedWorks.includes(art.id));
          setRelatedArtworks(related);
        }
      }

      setIsLoading(false);
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">未找到作品</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">抱歉，未找到您搜尋的藝術作品。</p>
        <Link
          href="/gallery"
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          返回作品集
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pb-24">
      {/* 作品圖片區塊 - 全幅展示 */}
      <div className="w-full h-[60vh] relative bg-gray-100 dark:bg-gray-800">
        <Image src={artwork.image} alt={artwork.title} fill className="object-contain" priority />
      </div>

      {/* 導航和標題 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/gallery"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            <svg
              className="mr-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              ></path>
            </svg>
            返回作品集
          </Link>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {artwork.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm">
              {artwork.category}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">{artwork.year}</span>
          </div>
        </div>
      </div>

      {/* 作品詳情 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 作品描述 */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              關於這件作品
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {artwork.fullDescription}
            </p>

            {/* 創作理念 */}
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                創作理念
              </h2>
              <blockquote className="pl-4 border-l-4 border-indigo-600 italic text-gray-700 dark:text-gray-300">
                藝術是情感的表達，是思想的交流，是靈魂的對話。每一筆每一畫都承載著對生活的理解與感受，希望觀者能在作品中找到共鳴，感受那份創作時的情感。
              </blockquote>
            </div>
          </div>

          {/* 作品資訊 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">作品資訊</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">創作年份</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{artwork.year}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">媒材</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{artwork.medium}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{artwork.dimensions}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">收藏地點</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">{artwork.location}</p>
                </div>
              </div>

              {/* 聯絡按鈕 */}
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="w-full flex justify-center py-3 px-4 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-colors"
                >
                  詢問此作品
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 相關作品 */}
        {relatedArtworks.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">相關作品</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArtworks.map((relatedArt) => (
                <div
                  key={relatedArt.id}
                  className="group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div className="aspect-w-4 aspect-h-3 w-full overflow-hidden bg-gray-200">
                    <Image
                      src={relatedArt.image}
                      alt={relatedArt.title}
                      width={600}
                      height={400}
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {relatedArt.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {relatedArt.description}
                    </p>
                    <Link
                      href={`/gallery/${relatedArt.id}`}
                      className="mt-2 inline-flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium"
                    >
                      查看詳情
                      <svg
                        className="ml-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
