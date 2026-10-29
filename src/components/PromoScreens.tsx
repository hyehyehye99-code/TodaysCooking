'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import s from '@/app/promo.module.css';
const screens = [
 {name:'레시피 모으기', number:'01',title:'다시 찾고 싶은 맛,\n나만의 레시피북에.',text:'좋아하는 레시피를 저장하고 태그로 정리해요. 다음에 먹고 싶은 메뉴를 더 쉽게 찾아보세요.',image:'recipes',mascot:'reading-recipe',label:'레시피 목록'},
 {name:'재료 확인하기',number:'02',title:'냉장고 속 재료,\n이제 한눈에.',text:'집에 있는 재료와 필요한 재료를 확인해요. 요리를 시작하기 전에 무엇이 있는지 챙길 수 있어요.',image:'detail',mascot:'fridge-open',label:'레시피 재료 확인'},
 {name:'장보기 챙기기',number:'03',title:'필요한 것만 쏙,\n장보기도 가볍게.',text:'살 재료를 장보기 목록에 모아두세요. 하나씩 확인하며 빠뜨리는 재료 없이 준비해요.',image:'shopping',mascot:'shopping-basket',label:'장보기 목록'},
];
export function PromoScreens(){const [active,setActive]=useState(0);const item=screens[active];return <div className={s.showcase}><div className={s.tabs} role="tablist" aria-label="앱 기능">{screens.map((x,i)=><button key={x.image} id={`tab-${i}`} type="button" role="tab" aria-selected={active===i} aria-controls="screen-panel" tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{let next=active;if(e.key==='ArrowRight')next=(active+1)%3;else if(e.key==='ArrowLeft')next=(active+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();setActive(next);document.getElementById(`tab-${next}`)?.focus();}}>{x.number} &nbsp; {x.name}</button>)}</div><div className={s.featurePanel} id="screen-panel" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}><div className={s.featureCopy}><img src={`/mascot/${item.mascot}.png`} alt="" width="130" height="145"/><p className={s.eyebrow}>작은 습관 {item.number}</p><h3>{item.title}</h3><p>{item.text}</p><span className={s.captureLabel}>실제 앱 화면 · 예시 데이터</span></div><div className={s.featurePhone}><img src={`/promo/${item.image}.png`} alt={`우리집 레시피 실제 ${item.label} 화면`} width="780" height="1688"/></div></div></div>}
