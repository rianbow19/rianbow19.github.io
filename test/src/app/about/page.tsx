import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* 頁面標題 */}
      <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">關於藝術家</h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-100">
              了解創作背後的故事與靈感
            </p>
          </div>
        </div>
      </div>

      {/* 藝術家簡介 */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="relative">
              <div className="aspect-w-4 aspect-h-5 rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="https://source.unsplash.com/random/800x1000/?artist,portrait"
                  alt="藝術家形象"
                  width={800}
                  height={1000}
                  className="object-cover object-center"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-indigo-100 dark:bg-indigo-900/30 rounded-full z-0"></div>
            </div>

            <div className="mt-12 lg:mt-0">
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">張藝術</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  作為一名當代藝術家，我致力於通過不同的媒介和風格探索藝術與人類情感之間的聯繫。我的作品融合了傳統與現代元素，嘗試捕捉生活中的美麗、複雜性和矛盾。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  我在台北藝術大學接受了正規的藝術教育，之後在歐洲和亞洲各地遊歷，汲取不同文化的靈感。這些經歷深刻塑造了我的藝術觀念和創作風格。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  如今，我的作品已在多個國家展出，並被收藏於多家博物館和私人收藏家中。我持續探索新的表現形式，挑戰自己的創作界限。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 創作歷程 */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">創作歷程</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              從早期探索到當代風格的形成
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* 早期探索 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 w-full">
                <Image
                  src="https://source.unsplash.com/random/600x400/?abstract,early"
                  alt="早期創作"
                  width={600}
                  height={400}
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  早期探索 (2010-2014)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  在藝術學習初期，我專注於掌握基本技法，同時大膽嘗試不同風格和媒材。這段時期的作品常帶有實驗性質，反映了我對藝術可能性的好奇和探索精神。
                </p>
              </div>
            </div>

            {/* 風格發展 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 w-full">
                <Image
                  src="https://source.unsplash.com/random/600x400/?abstract,middle"
                  alt="風格發展"
                  width={600}
                  height={400}
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  風格發展 (2015-2019)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  隨著技術的成熟和視野的拓展，我開始形成自己獨特的藝術風格。這段時期的作品更加聚焦於情感表達和社會議題，色彩運用和構圖更加自信和大膽。
                </p>
              </div>
            </div>

            {/* 當代創作 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 w-full">
                <Image
                  src="https://source.unsplash.com/random/600x400/?abstract,contemporary"
                  alt="當代創作"
                  width={600}
                  height={400}
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  當代創作 (2020-至今)
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  現階段的創作融合了傳統與數位技術，探索更加複雜的主題和表現形式。我的作品更加關注人與自然、傳統與創新之間的對話，嘗試通過藝術形式回應當代社會的變化與挑戰。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 藝術理念 */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-16">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">藝術理念</h2>
              <div className="mt-4 h-1 w-20 bg-indigo-600 rounded"></div>
            </div>
            <div className="mt-8 lg:mt-0 lg:col-span-2">
              <div className="space-y-6">
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  我相信藝術是情感與思想最直接的表達方式。在創作過程中，我尋求真實地呈現內心世界，同時與觀眾建立情感的共鳴。每一件作品都是一次對話的邀請，一次感官和心靈的探索。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  我的藝術語言融合了東西方美學元素，探索傳統與現代，自然與人工之間的平衡。我特別關注色彩、形式和質感如何影響人的情緒和感知，並嘗試通過這些元素創造出豐富的視覺體驗。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  在這個數位化和快節奏的時代，我希望我的藝術作品能夠提供一個停下來思考和感受的空間，邀請觀眾重新連接自己的情感世界和周圍的環境。
                </p>
                <blockquote className="pl-4 border-l-4 border-indigo-600 italic text-xl text-gray-700 dark:text-gray-300">
                  "藝術不僅是表達，更是探索和發現的過程。每一筆都是對未知的探尋，每一件作品都是一次重新認識自己和世界的機會。"
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 展覽經歷 */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">展覽經歷</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              國內外主要展覽和獲獎記錄
            </p>
          </div>

          <div className="space-y-8">
            {/* 展覽項目 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    「色彩的對話」個展
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">台北當代藝術館</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-gray-500 dark:text-gray-400">2023</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                展出抽象表現主義系列作品，探索色彩與情感的關聯。展覽獲得評論界高度讚譽，吸引超過5,000名觀眾。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    亞洲當代藝術聯展
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">香港藝術中心</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-gray-500 dark:text-gray-400">2022</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                受邀參加亞洲地區重要聯展，與來自十個國家的藝術家共同展出。作品《靈魂之窗》獲選為展覽代表作。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    國際新銳藝術家大展
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">柏林現代藝術館</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-gray-500 dark:text-gray-400">2021</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                作品《城市脈動》系列入選國際重要展覽，獲得「年度新銳藝術家」提名，並被德國藝術基金會收藏。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    「內心風景」雙個展
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">高雄市立美術館</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-gray-500 dark:text-gray-400">2020</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                與知名藝術家陳大師合作舉辦聯合個展，展出風景畫和抽象作品系列，探討自然與心靈的連結。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA區域 */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-600 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  <span className="block">想要了解更多？</span>
                  <span className="block">歡迎聯繫或預約參觀</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-indigo-100">
                  無論是對作品的詢問、合作提案，或安排工作室參觀，我們都期待您的聯繫。
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:ml-8">
                <div className="inline-flex rounded-md shadow">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 md:text-lg"
                  >
                    聯絡我們
                  </Link>
                </div>
                <div className="ml-4 inline-flex rounded-md shadow">
                  <Link
                    href="/gallery"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-700 md:text-lg"
                  >
                    瀏覽作品集
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
