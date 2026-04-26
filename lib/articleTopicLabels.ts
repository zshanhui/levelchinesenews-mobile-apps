import { NativeLanguage } from './nativeLanguage';

/**
 * Chinese topic keys from `GET /articles/topics` → English UI labels.
 * Keep in sync with `lcn-read-service/app/utils/tags.py` `TOPIC_TAGS` keys.
 */
export const ARTICLE_TOPIC_LABEL_EN: Record<string, string> = {
  AI时代: 'AI Era',
  AI行业: 'AI Industry',
  汽车行业: 'Automotive',
  航空太空: 'Aviation & Space',
  食品: 'Food',
  中国城市: 'Chinese Cities',
  美国本地: 'US Cities',
  中国科技公司: 'China Tech',
  东南亚: 'SE Asia',
  硅谷科技公司: 'Silicon Valley Tech',
  新加坡生活: 'Life in Singapore',
  马斯克企业: 'Musk Inc',
  金融业: 'Finance Ind',
  新加坡观点: 'Singaporean Views',
  打工人: 'Work & Jobs',
  国际: 'World',
  芯片行业: 'Semiconductors',
  又裁员了: 'Layoffs',
  游戏新闻: 'Gaming News',
};

export function articleTopicDisplayLabel(
  topicKeyZh: string,
  nativeLanguage: NativeLanguage,
): string {
  if (nativeLanguage === NativeLanguage.ZH) {
    return topicKeyZh;
  }
  return ARTICLE_TOPIC_LABEL_EN[topicKeyZh] ?? topicKeyZh;
}
