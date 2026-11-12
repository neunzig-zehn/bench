# The Last 10 results

Score is intelligence from 0 to 100 (the mean of the tracks' scores). Time and cost are the average per task, one full multi-step run, including every retry the provider billed.

## Leaderboard

| Model | Score | Time per task | Cost per task | Steps | Cache hit | Finished |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 99.0 | 28.2 s | $0.0223 | 4.9 | 48 % | 100 % |
| openai/gpt-6.1-terra:medium | 99.0 | 35.2 s | $0.0268 | 5.0 | 48 % | 100 % |
| openai/gpt-6.1-terra:high | 98.8 | 45.0 s | $0.0314 | 4.9 | 46 % | 100 % |
| google/gemini-4-hydrogen:medium | 97.4 | 73.9 s | $0.11 | 6.6 | 41 % | 100 % |

## Reasoning levels

| Model | Effort | Score | Time per task | Cost per task | Steps |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra | low | 99.0 | 28.2 s | $0.0223 | 4.9 |
| openai/gpt-6.1-terra | medium | 99.0 | 35.2 s | $0.0268 | 5.0 |
| openai/gpt-6.1-terra | high | 98.8 | 45.0 s | $0.0314 | 4.9 |
| google/gemini-4-hydrogen | medium | 97.4 | 73.9 s | $0.11 | 6.6 |

## By language

| Model | DE score | time | cost | EN score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 99.0 | 28.1 s | $0.0228 | 99.0 | 28.4 s | $0.0218 |
| openai/gpt-6.1-terra:medium | 99.0 | 35.0 s | $0.0269 | 98.9 | 35.4 s | $0.0268 |
| openai/gpt-6.1-terra:high | 98.5 | 44.9 s | $0.0315 | 99.2 | 45.0 s | $0.0313 |
| google/gemini-4-hydrogen:medium | 98.6 | 75.6 s | $0.11 | 96.2 | 72.1 s | $0.11 |

## Docs

| Model | Score | Time per task | Cost per task | Steps | Cache hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 100.0 | 37.9 s | $0.0300 | 3.3 | 8 % |
| openai/gpt-6.1-terra:medium | 100.0 | 38.3 s | $0.0307 | 3.2 | 7 % |
| openai/gpt-6.1-terra:high | 100.0 | 41.1 s | $0.0319 | 3.3 | 11 % |
| google/gemini-4-hydrogen:medium | 100.0 | 67.6 s | $0.10 | 4.3 | 22 % |

| Task | openai/gpt-6.1-terra:low score | time | cost | openai/gpt-6.1-terra:medium score | time | cost | openai/gpt-6.1-terra:high score | time | cost | google/gemini-4-hydrogen:medium score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| docs-contract-terms-de | 100.0 | 11.8 s | $0.0099 | 100.0 | 12.7 s | $0.0106 | 100.0 | 13.2 s | $0.0107 | 100.0 | 49.6 s | $0.0693 |
| docs-contract-terms-en | 100.0 | 14.1 s | $0.0092 | 100.0 | 11.8 s | $0.0094 | 100.0 | 13.8 s | $0.0101 | 100.0 | 43.2 s | $0.0619 |
| docs-datasheet-fields-de | 100.0 | 14.8 s | $0.0075 | 100.0 | 11.4 s | $0.0078 | 100.0 | 11.1 s | $0.0080 | 100.0 | 32.4 s | $0.0438 |
| docs-datasheet-fields-en | 100.0 | 11.7 s | $0.0070 | 100.0 | 10.2 s | $0.0072 | 100.0 | 11.8 s | $0.0077 | 100.0 | 28.0 s | $0.0357 |
| docs-gaeb-lv-structure-de | 100.0 | 74.7 s | $0.0838 | 100.0 | 76.0 s | $0.0839 | 100.0 | 78.7 s | $0.0846 | 100.0 | 86.0 s | $0.17 |
| docs-gaeb-lv-structure-en | 100.0 | 73.9 s | $0.0832 | 100.0 | 71.1 s | $0.0803 | 100.0 | 76.2 s | $0.0838 | 100.0 | 81.0 s | $0.17 |
| docs-lv-ocr-structure-de | 100.0 | 69.8 s | $0.0483 | 100.0 | 70.1 s | $0.0484 | 100.0 | 71.1 s | $0.0486 | 100.0 | 100.1 s | $0.14 |
| docs-lv-ocr-structure-en | 100.0 | 67.9 s | $0.0448 | 100.0 | 68.5 s | $0.0449 | 100.0 | 67.7 s | $0.0453 | 100.0 | 89.1 s | $0.12 |
| docs-offer-ocr-lines-de | 100.0 | 28.1 s | $0.0157 | 100.0 | 32.5 s | $0.0175 | 100.0 | 36.1 s | $0.0189 | 100.0 | 80.7 s | $0.10 |
| docs-offer-ocr-lines-en | 100.0 | 26.7 s | $0.0148 | 100.0 | 31.4 s | $0.0169 | 100.0 | 37.2 s | $0.0190 | 100.0 | 84.2 s | $0.0990 |
| docs-offer-scan-lines-de | 100.0 | 29.3 s | $0.0187 | 100.0 | 33.4 s | $0.0213 | 100.0 | 40.4 s | $0.0240 | 100.0 | 70.9 s | $0.0977 |
| docs-offer-scan-lines-en | 100.0 | 31.9 s | $0.0169 | 100.0 | 30.0 s | $0.0199 | 100.0 | 35.7 s | $0.0220 | 100.0 | 66.5 s | $0.0960 |

## Plans

| Model | Score | Time per task | Cost per task | Steps | Cache hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 99.7 | 21.8 s | $0.0263 | 4.5 | 41 % |
| openai/gpt-6.1-terra:medium | 100.0 | 37.2 s | $0.0389 | 4.9 | 46 % |
| openai/gpt-6.1-terra:high | 100.0 | 55.3 s | $0.0482 | 4.8 | 43 % |
| google/gemini-4-hydrogen:medium | 96.3 | 85.8 s | $0.12 | 5.1 | 41 % |

| Task | openai/gpt-6.1-terra:low score | time | cost | openai/gpt-6.1-terra:medium score | time | cost | openai/gpt-6.1-terra:high score | time | cost | google/gemini-4-hydrogen:medium score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| plans-cable-tray-de | 100.0 | 18.8 s | $0.0220 | 100.0 | 32.5 s | $0.0321 | 100.0 | 47.3 s | $0.0413 | 100.0 | 75.5 s | $0.10 |
| plans-cable-tray-en | 100.0 | 19.9 s | $0.0229 | 100.0 | 29.1 s | $0.0342 | 100.0 | 35.3 s | $0.0372 | 100.0 | 64.7 s | $0.0878 |
| plans-combined-takeoff-de | 99.5 | 30.3 s | $0.0456 | 100.0 | 52.8 s | $0.0594 | 100.0 | 76.3 s | $0.0702 | 93.8 | 122.8 s | $0.17 |
| plans-combined-takeoff-en | 97.4 | 28.9 s | $0.0473 | 100.0 | 56.8 s | $0.0652 | 100.0 | 64.3 s | $0.0667 | 94.3 | 106.3 s | $0.15 |
| plans-pipe-runs-de | 100.0 | 19.8 s | $0.0207 | 100.0 | 25.6 s | $0.0291 | 100.0 | 35.5 s | $0.0368 | 100.0 | 75.6 s | $0.11 |
| plans-pipe-runs-en | 100.0 | 13.8 s | $0.0178 | 100.0 | 24.1 s | $0.0297 | 100.0 | 28.7 s | $0.0239 | 100.0 | 69.6 s | $0.0943 |
| plans-room-areas-de | 100.0 | 20.0 s | $0.0297 | 100.0 | 23.1 s | $0.0311 | 100.0 | 38.9 s | $0.0373 | 98.1 | 65.5 s | $0.0920 |
| plans-room-areas-en | 100.0 | 21.4 s | $0.0259 | 100.0 | 23.9 s | $0.0358 | 100.0 | 27.1 s | $0.0385 | 100.0 | 71.5 s | $0.0961 |
| plans-survey-areas-de | 99.5 | 20.9 s | $0.0144 | 100.0 | 60.6 s | $0.0389 | 100.0 | 95.9 s | $0.0586 | 96.3 | 114.8 s | $0.15 |
| plans-survey-areas-en | 100.0 | 18.3 s | $0.0138 | 100.0 | 60.1 s | $0.0389 | 100.0 | 141.9 s | $0.0907 | 94.0 | 160.3 s | $0.22 |
| plans-symbol-count-de | 100.0 | 23.8 s | $0.0287 | 100.0 | 31.7 s | $0.0372 | 100.0 | 32.4 s | $0.0369 | 85.7 | 52.0 s | $0.0794 |
| plans-symbol-count-en | 100.0 | 25.1 s | $0.0262 | 100.0 | 25.4 s | $0.0348 | 100.0 | 39.9 s | $0.0407 | 93.1 | 51.6 s | $0.0759 |

## Calc

| Model | Score | Time per task | Cost per task | Steps | Cache hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 100.0 | 27.2 s | $0.0164 | 5.8 | 68 % |
| openai/gpt-6.1-terra:medium | 100.0 | 34.0 s | $0.0191 | 5.8 | 68 % |
| openai/gpt-6.1-terra:high | 100.0 | 37.4 s | $0.0216 | 5.7 | 65 % |
| google/gemini-4-hydrogen:medium | 91.7 | 51.9 s | $0.0872 | 6.5 | 37 % |

| Task | openai/gpt-6.1-terra:low score | time | cost | openai/gpt-6.1-terra:medium score | time | cost | openai/gpt-6.1-terra:high score | time | cost | google/gemini-4-hydrogen:medium score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| calc-cable-tray-de | 100.0 | 27.0 s | $0.0180 | 100.0 | 34.4 s | $0.0212 | 100.0 | 40.4 s | $0.0275 | 100.0 | 59.5 s | $0.0920 |
| calc-cable-tray-en | 100.0 | 31.9 s | $0.0158 | 100.0 | 37.6 s | $0.0216 | 100.0 | 48.3 s | $0.0238 | 100.0 | 56.6 s | $0.0905 |
| calc-feeder-sizing-de | 100.0 | 12.8 s | $0.0089 | 100.0 | 24.2 s | $0.0121 | 100.0 | 15.5 s | $0.0107 | 100.0 | 31.8 s | $0.0575 |
| calc-feeder-sizing-en | 100.0 | 15.3 s | $0.0090 | 100.0 | 27.5 s | $0.0119 | 100.0 | 20.4 s | $0.0132 | 100.0 | 34.1 s | $0.0605 |
| calc-heating-load-de | 100.0 | 24.8 s | $0.0168 | 100.0 | 36.6 s | $0.0192 | 100.0 | 41.5 s | $0.0209 | 100.0 | 59.6 s | $0.0931 |
| calc-heating-load-en | 100.0 | 22.3 s | $0.0162 | 100.0 | 31.1 s | $0.0168 | 100.0 | 30.1 s | $0.0188 | 100.0 | 58.5 s | $0.12 |
| calc-offer-total-de | 100.0 | 27.3 s | $0.0267 | 100.0 | 31.9 s | $0.0277 | 100.0 | 38.1 s | $0.0312 | 100.0 | 78.4 s | $0.13 |
| calc-offer-total-en | 100.0 | 34.8 s | $0.0247 | 100.0 | 32.1 s | $0.0265 | 100.0 | 42.3 s | $0.0299 | 100.0 | 55.2 s | $0.10 |
| calc-paint-takeoff-de | 100.0 | 20.1 s | $0.0086 | 100.0 | 27.4 s | $0.0102 | 100.0 | 25.7 s | $0.0095 | 100.0 | 32.8 s | $0.0553 |
| calc-paint-takeoff-en | 100.0 | 17.8 s | $0.0081 | 100.0 | 26.4 s | $0.0082 | 100.0 | 26.2 s | $0.0104 | 100.0 | 28.7 s | $0.0451 |
| calc-pipe-cutting-de | 100.0 | 40.5 s | $0.0211 | 100.0 | 47.7 s | $0.0269 | 100.0 | 61.8 s | $0.0330 | 100.0 | 66.7 s | $0.11 |
| calc-pipe-cutting-en | 100.0 | 52.5 s | $0.0224 | 100.0 | 50.6 s | $0.0266 | 100.0 | 58.5 s | $0.0305 | 0.0 | 60.9 s | $0.0938 |

## Hours

| Model | Score | Time per task | Cost per task | Steps | Cache hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 96.6 | 23.7 s | $0.0182 | 4.4 | 55 % |
| openai/gpt-6.1-terra:medium | 96.8 | 30.7 s | $0.0211 | 4.1 | 51 % |
| openai/gpt-6.1-terra:high | 96.6 | 50.2 s | $0.0278 | 4.0 | 49 % |
| google/gemini-4-hydrogen:medium | 99.2 | 83.9 s | $0.12 | 6.2 | 47 % |

| Task | openai/gpt-6.1-terra:low score | time | cost | openai/gpt-6.1-terra:medium score | time | cost | openai/gpt-6.1-terra:high score | time | cost | google/gemini-4-hydrogen:medium score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| hours-drywall-rules-de | 95.7 | 27.7 s | $0.0208 | 96.0 | 31.5 s | $0.0203 | 95.4 | 49.7 s | $0.0271 | 97.6 | 90.7 s | $0.13 |
| hours-drywall-rules-en | 96.2 | 22.5 s | $0.0160 | 95.4 | 28.3 s | $0.0187 | 95.9 | 58.6 s | $0.0288 | 100.0 | 98.0 s | $0.13 |
| hours-electrical-new-build-de | 99.9 | 23.8 s | $0.0181 | 95.3 | 30.0 s | $0.0220 | 95.3 | 53.6 s | $0.0296 | 99.9 | 83.4 s | $0.12 |
| hours-electrical-new-build-en | 95.0 | 19.0 s | $0.0163 | 99.9 | 29.2 s | $0.0208 | 99.9 | 45.0 s | $0.0271 | 99.9 | 72.1 s | $0.11 |
| hours-electrical-occupied-renovation-de | 92.4 | 28.3 s | $0.0230 | 98.1 | 33.9 s | $0.0251 | 95.0 | 74.0 s | $0.0396 | 99.9 | 91.0 s | $0.13 |
| hours-electrical-occupied-renovation-en | 99.9 | 27.5 s | $0.0225 | 99.9 | 34.2 s | $0.0245 | 99.9 | 57.8 s | $0.0348 | 99.9 | 105.8 s | $0.14 |
| hours-heating-small-quantities-de | 93.7 | 24.3 s | $0.0184 | 93.4 | 31.9 s | $0.0210 | 92.8 | 54.0 s | $0.0277 | 98.0 | 104.3 s | $0.12 |
| hours-heating-small-quantities-en | 94.8 | 20.1 s | $0.0152 | 93.3 | 30.2 s | $0.0199 | 93.7 | 58.7 s | $0.0286 | 98.0 | 74.5 s | $0.10 |
| hours-plumbing-old-building-de | 95.6 | 22.0 s | $0.0189 | 95.6 | 27.9 s | $0.0207 | 95.6 | 34.8 s | $0.0215 | 97.4 | 81.3 s | $0.12 |
| hours-plumbing-old-building-en | 95.9 | 20.7 s | $0.0166 | 95.6 | 26.9 s | $0.0191 | 95.6 | 42.5 s | $0.0253 | 99.5 | 67.4 s | $0.0982 |
| hours-ventilation-duct-surface-de | 99.9 | 25.9 s | $0.0172 | 99.9 | 26.8 s | $0.0198 | 99.9 | 38.6 s | $0.0230 | 99.9 | 71.7 s | $0.11 |
| hours-ventilation-duct-surface-en | 99.9 | 22.2 s | $0.0152 | 99.9 | 37.5 s | $0.0217 | 99.9 | 35.0 s | $0.0207 | 99.9 | 66.7 s | $0.0945 |

## Cost

| Model | Score | Time per task | Cost per task | Steps | Cache hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 99.4 | 49.4 s | $0.0368 | 7.5 | 74 % |
| openai/gpt-6.1-terra:medium | 99.6 | 56.9 s | $0.0425 | 7.8 | 74 % |
| openai/gpt-6.1-terra:high | 99.6 | 67.2 s | $0.0483 | 7.5 | 68 % |
| google/gemini-4-hydrogen:medium | 99.2 | 125.3 s | $0.20 | 13.5 | 76 % |

| Task | openai/gpt-6.1-terra:low score | time | cost | openai/gpt-6.1-terra:medium score | time | cost | openai/gpt-6.1-terra:high score | time | cost | google/gemini-4-hydrogen:medium score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cost-change-order-pricing-de | 100.0 | 18.9 s | $0.0134 | 100.0 | 22.1 s | $0.0154 | 100.0 | 25.4 s | $0.0175 | 100.0 | 80.6 s | $0.12 |
| cost-change-order-pricing-en | 100.0 | 17.6 s | $0.0124 | 100.0 | 21.9 s | $0.0153 | 100.0 | 28.6 s | $0.0188 | 100.0 | 78.5 s | $0.12 |
| cost-historic-price-estimate-de | 99.8 | 46.2 s | $0.0412 | 100.0 | 57.2 s | $0.0495 | 100.0 | 70.9 s | $0.0562 | 97.7 | 148.4 s | $0.24 |
| cost-historic-price-estimate-en | 100.0 | 56.2 s | $0.0441 | 100.0 | 57.5 s | $0.0476 | 100.0 | 74.5 s | $0.0553 | 100.0 | 154.2 s | $0.27 |
| cost-supplier-offer-unit-prices-de | 98.4 | 84.6 s | $0.0672 | 98.4 | 104.2 s | $0.0771 | 98.4 | 114.9 s | $0.0850 | 98.6 | 165.1 s | $0.28 |
| cost-supplier-offer-unit-prices-en | 97.3 | 86.2 s | $0.0676 | 98.4 | 101.2 s | $0.0774 | 98.6 | 114.2 s | $0.0831 | 97.3 | 154.7 s | $0.25 |
| cost-unit-price-build-up-de | 100.0 | 44.8 s | $0.0240 | 100.0 | 45.4 s | $0.0296 | 100.0 | 53.2 s | $0.0354 | 100.0 | 117.8 s | $0.17 |
| cost-unit-price-build-up-en | 100.0 | 40.7 s | $0.0245 | 100.0 | 45.9 s | $0.0285 | 100.0 | 56.0 s | $0.0353 | 100.0 | 102.9 s | $0.14 |

## Dialog

| Model | Score | Time per task | Cost per task | Steps | Cache hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| openai/gpt-6.1-terra:low | 98.1 | 14.2 s | $0.0088 | 5.0 | 51 % |
| openai/gpt-6.1-terra:medium | 97.3 | 18.7 s | $0.0113 | 5.5 | 53 % |
| openai/gpt-6.1-terra:high | 96.8 | 22.2 s | $0.0130 | 4.7 | 45 % |
| google/gemini-4-hydrogen:medium | 98.3 | 40.0 s | $0.0561 | 6.3 | 34 % |

| Task | openai/gpt-6.1-terra:low score | time | cost | openai/gpt-6.1-terra:medium score | time | cost | openai/gpt-6.1-terra:high score | time | cost | google/gemini-4-hydrogen:medium score | time | cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dialog-feeder-unknown-length-de | 100.0 | 13.4 s | $0.0081 | 100.0 | 15.4 s | $0.0096 | 100.0 | 22.4 s | $0.0122 | 100.0 | 39.6 s | $0.0591 |
| dialog-feeder-unknown-length-en | 100.0 | 19.7 s | $0.0083 | 100.0 | 19.3 s | $0.0099 | 100.0 | 18.3 s | $0.0102 | 100.0 | 40.8 s | $0.0559 |
| dialog-lighting-contradictions-de | 91.7 | 14.0 s | $0.0107 | 91.7 | 22.0 s | $0.0147 | 91.7 | 23.5 s | $0.0149 | 91.7 | 56.1 s | $0.0672 |
| dialog-lighting-contradictions-en | 89.6 | 15.8 s | $0.0112 | 89.6 | 21.3 s | $0.0131 | 89.6 | 45.0 s | $0.0214 | 91.7 | 42.2 s | $0.0604 |
| dialog-schedule-decision-de | 100.0 | 19.6 s | $0.0114 | 100.0 | 19.3 s | $0.0123 | 86.7 | 42.3 s | $0.0247 | 100.0 | 63.6 s | $0.0856 |
| dialog-schedule-decision-en | 100.0 | 16.5 s | $0.0100 | 91.7 | 44.7 s | $0.0232 | 100.0 | 22.6 s | $0.0150 | 100.0 | 61.0 s | $0.0879 |
| dialog-sockets-fully-specified-de | 100.0 | 7.3 s | $0.0064 | 100.0 | 9.6 s | $0.0066 | 100.0 | 9.2 s | $0.0064 | 100.0 | 20.1 s | $0.0297 |
| dialog-sockets-fully-specified-en | 100.0 | 10.6 s | $0.0062 | 100.0 | 9.7 s | $0.0063 | 100.0 | 10.4 s | $0.0064 | 100.0 | 20.4 s | $0.0256 |
| dialog-wallbox-unit-price-de | 100.0 | 12.2 s | $0.0082 | 100.0 | 12.7 s | $0.0086 | 100.0 | 14.5 s | $0.0095 | 100.0 | 27.7 s | $0.0449 |
| dialog-wallbox-unit-price-en | 100.0 | 12.6 s | $0.0076 | 100.0 | 13.1 s | $0.0084 | 100.0 | 13.3 s | $0.0093 | 100.0 | 28.7 s | $0.0450 |
