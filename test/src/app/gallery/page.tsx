"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// 模擬資料：藝術作品
const artworks = [
  {
    id: 1,
    title: "彩色幻想",
    description: "抽象表現主義，展現色彩的張力與活力",
    category: "抽象",
    image: "https://source.unsplash.com/random/800x600/?abstract,painting",
    year: 2023,
  },
  {
    id: 2,
    title: "靈魂之窗",
    description: "現代人像藝術，探索人類情感與內心世界",
    category: "人像",
    image: "https://source.unsplash.com/random/800x600/?portrait,art",
    year: 2022,
  },
  {
    id: 3,
    title: "自然詩篇",
    description: "當代風景畫，呈現大自然的壯麗與寧靜",
    category: "風景",
    image: "https://source.unsplash.com/random/800x600/?landscape,painting",
    year: 2023,
  },
  {
    id: 4,
    title: "城市脈動",
    description: "都市景觀，捕捉城市的節奏與能量",
    category: "風景",
    image: "https://source.unsplash.com/random/800x600/?cityscape,art",
    year: 2021,
  },
  {
    id: 5,
    title: "靜物思考",
    description: "當代靜物畫，探索物體與空間的關係",
    category: "靜物",
    image: "https://source.unsplash.com/random/800x600/?stilllife,art",
    year: 2022,
  },
  {
    id: 6,
    title: "夢境遊戲",
    description: "超現實主義作品，打破現實與夢境的界限",
    category: "超現實",
    image: "https://source.unsplash.com/random/800x600/?surreal,art",
    year: 2023,
  },
  {
    id: 7,
    title: "情緒波瀾",
    description: "表現主義作品，強烈表達內心情感",
    category: "表現",
    image: "https://source.unsplash.com/random/800x600/?expressionism,art",
    year: 2021,
  },
  {
    id: 8,
    title: "數位未來",
    description: "數位藝術，探索科技與藝術的融合",
    category: "數位",
    image: "https://source.unsplash.com/random/800x600/?digital,art",
    year: 2023,
  },
  {
    id: 9,
    title: "古典回響",
    description: "新古典主義作品，向傳統藝術致敬",
    category: "古典",
    image: "https://source.unsplash.com/random/800x600/?classic,art",
    year: 2022,
  },
];

// 所有類別
const allCategories = ["全部", ...new Set(artworks.map((artwork) => artwork.category))];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [sortBy, setSortBy] = useState("newest");

  // 過濾和排序作品
  const filteredArtworks = artworks
    .filter((artwork) => selectedCategory === "全部" || artwork.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.year - a.year;
      } else {
        return a.year - b.year;
      }
    });

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* 頁面標題 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">藝術作品集</h1>
          <p className="mt-4 text-indigo-100 max-w-2xl mx-auto">
            探索我們精心挑選的藝術作品，從抽象到寫實，從傳統到現代
          </p>
        </div>
      </div>

      {/* 過濾和排序控制 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          {/* 類別過濾 */}
          <div className="flex flex-wrap gap-2">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm rounded-full ${
                  selectedCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                } transition-colors`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 排序控制 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">排序方式:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">最新優先</option>
              <option value="oldest">最舊優先</option>
            </select>
          </div>
        </div>
      </div>

      {/* 作品集網格 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {filteredArtworks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">沒有找到符合條件的作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtworks.map((artwork) => (
              <div
                key={artwork.id}
                className="group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <div className="aspect-w-4 aspect-h-3 w-full overflow-hidden bg-gray-200">
                  <Image
                    src={artwork.image}
                    alt={artwork.title}
                    width={800}
                    height={600}
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {artwork.title}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                        {artwork.category}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{artwork.year}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {artwork.description}
                  </p>
                  <Link
                    href={`/gallery/${artwork.id}`}
                    className="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium"
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
        )}
      </div>
    </div>
  );
}
