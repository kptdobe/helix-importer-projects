import { WPContentPager } from './project/explorers/WPContentPager';
import { WPPostWrapPager } from './project/explorers/WPPostWrapPager';

async function main() {
  const pager = new WPContentPager({
    nbMaxPages: 2,
    url: 'https://blogs.adobe.com/japan/creativecloud/'
  });
  const entries = await pager.explore();
  console.log(`Received ${entries.length}} entries!`);
  entries.forEach((e: any) => {
    console.log(e.url);
  });
  
}

main();