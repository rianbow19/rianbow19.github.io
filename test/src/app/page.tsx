import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* 英雄區塊 */}
      <section className="relative bg-white dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col justify-center items-center text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            <span className="block">藝術無界限</span>
            <span className="block mt-2 text-indigo-600">創意新視野</span>
          </h1>
          <p className="mt-6 max-w-md mx-auto text-lg text-gray-600 dark:text-gray-300">
            探索獨特的藝術作品集，體驗創意的無限可能。精選高質量藝術品，為您帶來視覺上的享受。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/gallery"
              className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-colors"
            >
              瀏覽作品集
            </Link>
            <Link
              href="/about"
              className="px-8 py-3 rounded-md bg-white text-indigo-600 font-medium border border-indigo-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm transition-colors dark:bg-gray-800 dark:text-indigo-400 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              了解更多
            </Link>
          </div>
        </div>
      </section>

      {/* 精選作品 */}
      <section className="bg-gray-50 dark:bg-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">精選作品</h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              探索我們的精選藝術作品，展現創意與想像力的無限可能。
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 作品1 */}
            <div className="group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden bg-gray-200">
                <Image
                  src="https://source.unsplash.com/random/600x400/?abstract,painting"
                  alt="抽象藝術作品"
                  width={600}
                  height={400}
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">彩色幻想</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  抽象表現主義，展現色彩的張力與活力
                </p>
                <Link
                  href="/gallery/1"
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

            {/* 作品2 */}
            <div className="group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden bg-gray-200">
                <Image
                  src="https://source.unsplash.com/random/600x400/?portrait,art"
                  alt="人像藝術作品"
                  width={600}
                  height={400}
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">靈魂之窗</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  現代人像藝術，探索人類情感與內心世界
                </p>
                <Link
                  href="/gallery/2"
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

            {/* 作品3 */}
            <div className="group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden bg-gray-200">
                <Image
                  src="https://source.unsplash.com/random/600x400/?landscape,painting"
                  alt="風景藝術作品"
                  width={600}
                  height={400}
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">自然詩篇</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  當代風景畫，呈現大自然的壯麗與寧靜
                </p>
                <Link
                  href="/gallery/3"
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
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              查看更多作品
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 關於藝術家 */}
      <section className="bg-white dark:bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="relative">
              <div className="aspect-w-4 aspect-h-5 rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="https://source.unsplash.com/random/600x800/?artist,creative"
                  alt="藝術家形象"
                  width={600}
                  height={800}
                  className="object-cover object-center"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-indigo-100 dark:bg-indigo-900/30 rounded-full z-0"></div>
            </div>
            <div className="mt-12 lg:mt-0">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">關於藝術家</h2>
              <p className="mt-6 text-gray-600 dark:text-gray-300">
                作為一名充滿熱情的藝術創作者，我致力於通過色彩、形狀和紋理的表達來探索人類情感和自然界的奧秘。我的作品融合了傳統技巧和現代視角，創造出獨特而引人入勝的視覺體驗。
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                我的創作靈感來源於日常生活中的細微觀察和深刻的情感共鳴。每件作品都代表了一段個人旅程，邀請觀眾進入一個充滿想像和反思的世界。
              </p>
              <div className="mt-8">
                <Link
                  href="/about"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                >
                  了解更多藝術家
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    ></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 藝術理念 */}
      <section className="bg-indigo-50 dark:bg-indigo-900/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">藝術理念</h2>
            <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
              "藝術是一種表達，一種感受，一種對生活的反思。在我的作品中，我尋求將內心深處的情感與外部世界的美麗融合，創造出超越現實的視覺體驗。"
            </p>
            <div className="mt-6">
              <span className="inline-block h-1 w-20 bg-indigo-600 rounded"></span>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">張藝術 | 創作者</p>
          </div>
        </div>
      </section>

      {/* 聯絡區塊 */}
      <section className="bg-white dark:bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">與我們聯繫</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              對作品有興趣或希望了解更多資訊？請與我們聯繫。
            </p>
            <div className="mt-10">
              <Link
                href="/contact"
                className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-colors"
              >
                聯絡我們
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
