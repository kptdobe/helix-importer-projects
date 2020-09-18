import { WPContentPager } from './project/explorers/WPContentPager';

async function main() {
  const pager = new WPContentPager({
    nbMaxPages: 2,
    url: 'https://blogs.adobe.com/adobeconnect/'
  });
  const entries = await pager.explore();
  console.log(entries);
}

main();