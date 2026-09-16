import almonds from "@/assets/veloiz-almonds.jpg";
import cashews from "@/assets/veloiz-cashews.jpg";
import pistachios from "@/assets/veloiz-pistachios.jpg";

export type Product = { id: string; slug: string; name: string; category: string; image: string; short: string; long: string; stock: number; prices: Record<number, number> };

export const products: Product[] = [
  { id:"1", slug:"mamra-almonds", name:"Mamra Almonds", category:"Almonds", image:almonds, short:"Small-batch almonds with a deep, lingering crunch.", long:"Naturally irregular and intensely flavoured, sourced from select mountain orchards and packed in short runs for peak freshness.", stock:7, prices:{250:725,500:1390,1000:2690} },
  { id:"2", slug:"w320-cashews", name:"Whole W320 Cashews", category:"Cashews", image:cashews, short:"Creamy whole cashews, graded for size and snap.", long:"A balanced everyday cashew with a clean ivory colour and naturally buttery finish.", stock:28, prices:{250:425,500:810,1000:1560} },
  { id:"3", slug:"roasted-pistachios", name:"Roasted Pistachios", category:"Pistachios", image:pistachios, short:"Open-shell pistachios, roasted low and slow.", long:"A measured roast preserves the nut’s sweetness while bringing out a crisp, savoury finish.", stock:5, prices:{250:575,500:1090,1000:2100} },
  { id:"4", slug:"kashmiri-walnuts", name:"Kashmiri Walnuts", category:"Walnuts", image:almonds, short:"Hand-sorted halves with gentle tannin.", long:"Light, buttery walnut halves chosen for freshness, colour, and a clean finish.", stock:22, prices:{250:495,500:940,1000:1810} },
  { id:"5", slug:"afghan-black-raisins", name:"Afghan Black Raisins", category:"Raisins", image:pistachios, short:"Dark, soft raisins with wine-like depth.", long:"Naturally dried for concentrated sweetness and a supple texture.", stock:31, prices:{250:295,500:560,1000:1050} },
  { id:"6", slug:"medjool-dates", name:"Medjool Dates", category:"Dates", image:cashews, short:"Plush dates with a caramel centre.", long:"Large, soft dates selected for their moist texture and layered caramel character.", stock:18, prices:{250:450,500:860,1000:1650} },
];

export const money = (value:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);
export const priceFor=(product:Product,weight:number)=>product.prices[weight]??product.prices[250]??0;