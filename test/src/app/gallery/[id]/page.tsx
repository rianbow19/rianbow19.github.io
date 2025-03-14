import Image from "next/image";
import Link from "next/link";

// 模擬數據集
const artworks = [
  {
    id: "1",
    title: "靜謐的湖泊",
    description: "一幅展現寧靜湖泊的抽象畫作，藍色和綠色的色調營造出平靜的氛圍。",
    fullDescription:
      "這幅作品捕捉了一個寧靜的湖泊景象，通過抽象的手法表現水面的波紋和周圍的自然環境。藍色和綠色的色調相互交織，創造出一種平靜而深邃的氛圍。畫作邀請觀眾沉浸在這片寧靜之中，感受大自然的和諧與美麗。作品靈感來源於藝術家童年時期常去的一個湖泊，那裡的寧靜與和平在藝術家心中留下了深刻的印象。",
    category: "抽象",
    image: "https://source.unsplash.com/random/600x400/?abstract,painting",
    year: 2021,
    dimensions: "80 x 60 cm",
    medium: "壓克力顏料",
    location: "私人收藏",
    relatedWorks: ["2", "5", "7"],
  },
  {
    id: "2",
    title: "城市脈動",
    description: "一幅充滿活力的城市景觀，捕捉了現代都市的節奏與能量。",
    fullDescription:
      "這幅作品捕捉了現代都市的節奏與能量，通過鮮明的色彩和動態的筆觸表現城市的脈動。紅色、黃色和藍色的色塊代表了城市中的建築、車流和人群，而交錯的線條則象徵著城市中無處不在的連接與互動。畫面中的光影變化暗示了城市從日出到日落的時間流轉，展現了都市生活的多面性與複雜性。這幅作品旨在引發觀眾對現代都市生活節奏的思考。",
    category: "現代",
    image: "https://source.unsplash.com/random/600x400/?city,art",
    year: 2020,
    dimensions: "100 x 80 cm",
    medium: "油彩",
    location: "城市美術館",
    relatedWorks: ["4", "6", "9"],
  },
  {
    id: "3",
    title: "記憶碎片",
    description: "一幅探索記憶本質的拼貼作品，結合了照片、文字和抽象元素。",
    fullDescription:
      "這幅拼貼作品探索了記憶的本質與片段化特性。藝術家結合了舊照片、手寫文字、報紙剪報和抽象繪畫元素，創造出一個視覺上豐富而情感上複雜的畫面。每個元素都代表著不同的記憶片段，它們相互重疊、融合或對比，反映了人類記憶的主觀性和不完整性。作品中央模糊的人像暗示了隨著時間推移，記憶如何逐漸褪色，而邊緣鮮明的色彩則代表那些深刻銘刻在心的情感瞬間。",
    category: "拼貼",
    image: "https://source.unsplash.com/random/600x400/?collage,memory",
    year: 2019,
    dimensions: "70 x 70 cm",
    medium: "混合媒材",
    location: "現代藝術博物館",
    relatedWorks: ["5", "8", "1"],
  },
  {
    id: "4",
    title: "自然之舞",
    description: "一幅描繪樹葉和風的互動的動態畫作，展現自然界的和諧運動。",
    fullDescription:
      "這幅作品捕捉了樹葉在風中舞動的瞬間，通過流暢的線條和漸變的色彩表現自然界的和諧運動。綠色和金色的色調代表著不同季節的變化，而畫面中的旋轉動態則象徵著生命的循環與永恆。藝術家使用了特殊的繪畫技法，使觀眾幾乎能感受到畫面中的微風拂面。這幅作品旨在喚起人們對自然界細微之美的欣賞，以及對環境保護的意識。",
    category: "風景",
    image: "https://source.unsplash.com/random/600x400/?nature,leaves",
    year: 2022,
    dimensions: "90 x 70 cm",
    medium: "水彩",
    location: "自然歷史博物館",
    relatedWorks: ["7", "2", "6"],
  },
  {
    id: "5",
    title: "內心風景",
    description: "一幅表現內心情感世界的抽象畫作，通過色彩和形狀傳達複雜情緒。",
    fullDescription:
      "這幅抽象作品探索了人類內心情感的複雜風景。藝術家通過豐富的色彩變化和有機的形狀構成，創造出一個視覺上引人入勝的情感地圖。溫暖的紅色和橙色代表熱情與活力，冷色調的藍色和紫色則象徵著平靜與內省，而交織在畫面中的黑色線條則暗示了貫穿一生的各種經歷與記憶。畫作邀請觀眾投射自己的情感體驗，在這片抽象的風景中找到共鳴與理解。",
    category: "抽象",
    image: "https://source.unsplash.com/random/600x400/?abstract,emotion",
    year: 2020,
    dimensions: "85 x 65 cm",
    medium: "壓克力顏料",
    location: "心理學博物館",
    relatedWorks: ["1", "3", "8"],
  },
  {
    id: "6",
    title: "工業詩篇",
    description: "一幅探索工業美學的作品，展現機械結構與人造環境的幾何美。",
    fullDescription:
      "這幅作品探索了工業環境中隱藏的美學元素，通過精確的線條和強烈的對比展現機械結構與人造環境的幾何美。畫面中的工廠、橋樑和城市基礎設施被簡化為基本的形狀和線條，創造出一種近乎詩意的視覺節奏。冷色調的配色方案強調了工業環境的冰冷特性，而偶爾出現的暖色調則暗示了人類活動的存在。這幅作品旨在引導觀眾重新審視那些被視為平凡或醜陋的工業景觀，發現其中的秩序與和諧。",
    category: "現代",
    image: "https://source.unsplash.com/random/600x400/?industrial,architecture",
    year: 2018,
    dimensions: "120 x 90 cm",
    medium: "油彩",
    location: "工業設計博物館",
    relatedWorks: ["9", "2", "4"],
  },
  {
    id: "7",
    title: "山間晨霧",
    description: "一幅捕捉山間晨霧的風景畫，展現自然的神秘與寧靜。",
    fullDescription:
      "這幅風景畫捕捉了山間晨霧的神秘與寧靜時刻。藝術家通過精細的筆觸和微妙的色彩變化，再現了霧氣在山間流動的輕盈感和第一縷陽光穿透霧氣的神奇瞬間。遠處的山峰若隱若現，近處的樹木和岩石則以更加清晰的細節呈現，創造出一種空間的深度感和層次感。整個畫面籠罩在一種夢幻般的氛圍中，邀請觀眾沉浸在這個被晨霧軟化的世界裡，感受大自然的神秘與美麗。",
    category: "風景",
    image: "https://source.unsplash.com/random/600x400/?mountains,fog",
    year: 2021,
    dimensions: "100 x 75 cm",
    medium: "油彩",
    location: "國家公園遊客中心",
    relatedWorks: ["4", "1", "3"],
  },
  {
    id: "8",
    title: "時間的痕跡",
    description: "一幅探索時間概念的實驗性作品，結合了鐘表元素和抽象表現手法。",
    fullDescription:
      "這幅實驗性作品探索了時間的流動與其在物質和心理層面留下的痕跡。畫面中央是一個解構的鐘表，其零件散布在畫面各處，象徵著時間的分解與重組。背景中的同心圓代表著時間的循環本質，而不規則的線條則暗示了時間體驗的主觀性。藝術家在創作過程中特意使用了會隨時間變化的材料，使作品本身也成為時間流逝的見證。這幅作品邀請觀眾思考時間的本質，以及它如何塑造我們的記憶、身份和對世界的理解。",
    category: "實驗",
    image: "https://source.unsplash.com/random/600x400/?time,clock",
    year: 2019,
    dimensions: "80 x 80 cm",
    medium: "混合媒材",
    location: "科學博物館",
    relatedWorks: ["3", "5", "9"],
  },
  {
    id: "9",
    title: "數字夢境",
    description: "一幅融合數字藝術和傳統繪畫的作品，探索虛擬與現實的界限。",
    fullDescription:
      "這幅作品融合了數字藝術和傳統繪畫技法，探索了虛擬與現實世界的交界處。畫面呈現了一個似真似幻的夢境空間，其中數字元素如像素、代碼和界面圖標與自然形態如樹木、水流和雲彩相互交織。藍色和紫色的色調營造出一種科技感的氛圍，而手繪的質感則保留了人類創作的溫度。這幅作品反映了藝術家對當代數字生活的思考，以及對技術如何重塑我們感知和體驗世界方式的探索。",
    category: "數字",
    image: "https://source.unsplash.com/random/600x400/?digital,dream",
    year: 2022,
    dimensions: "Digital + Print 70 x 50 cm",
    medium: "數字藝術 + 壓克力顏料",
    location: "數字藝術博物館",
    relatedWorks: ["6", "2", "8"],
  },
];

// 為靜態生成提供所有可能的ID參數
export function generateStaticParams() {
  return artworks.map((artwork) => ({
    id: artwork.id,
  }));
}

// 藝術品詳情頁面組件
export default function ArtworkDetail({ params }: { params: { id: string } }) {
  const artwork = artworks.find((art) => art.id === params.id);

  // 如果找不到藝術品，顯示錯誤信息
  if (!artwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">找不到藝術品</h1>
        <p className="text-lg mb-6">抱歉，我們找不到您請求的藝術品。</p>
        <Link
          href="/gallery"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          返回畫廊
        </Link>
      </div>
    );
  }

  // 獲取相關作品
  const relatedArtworks = artwork.relatedWorks
    ? artwork.relatedWorks.map((id) => artworks.find((art) => art.id === id)).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 頂部橫幅 */}
      <div className="w-full h-40 md:h-60 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="container mx-auto px-4 h-full flex items-end pb-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white">{artwork.title}</h1>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左側圖片 */}
          <div className="lg:w-2/3">
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src={artwork.image}
                alt={artwork.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                priority
              />
            </div>
          </div>

          {/* 右側信息 */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {artwork.title}
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm">
                    {artwork.category}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">{artwork.year}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{artwork.description}</p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    詳細描述
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">
                    {artwork.fullDescription}
                  </p>
                </div>
              </div>

              {/* 藝術品信息 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  藝術品信息
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">尺寸</span>
                    <span className="text-gray-900 dark:text-white">{artwork.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">媒材</span>
                    <span className="text-gray-900 dark:text-white">{artwork.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">創作年份</span>
                    <span className="text-gray-900 dark:text-white">{artwork.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">收藏地點</span>
                    <span className="text-gray-900 dark:text-white">{artwork.location}</span>
                  </div>
                </div>
              </div>

              {/* 返回按鈕 */}
              <div className="mt-8">
                <Link
                  href="/gallery"
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  返回畫廊
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 相關作品 */}
        {relatedArtworks.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">相關作品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArtworks.map((relatedArt) => (
                <Link href={`/gallery/${relatedArt?.id}`} key={relatedArt?.id} className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform group-hover:shadow-lg group-hover:-translate-y-1">
                    <div className="relative h-48 w-full">
                      <Image
                        src={relatedArt?.image || ""}
                        alt={relatedArt?.title || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {relatedArt?.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {relatedArt?.year}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
