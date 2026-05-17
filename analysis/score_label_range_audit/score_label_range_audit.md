# SETA Score Label Range Audit

Internal calibration audit for score-like fields in the enriched chart-history dataset.

## Dataset

- Source CSV: `C:\Users\shane\snt_exports\final_combined_data_enriched_chart_history.csv`
- Rows: `7,970`
- Columns: `606`
- Audited score-like fields: `213`

## Public exposure rule of thumb

- Public dashboard should prefer labels over raw model/debug scores.
- Member/internal mode may show rounded raw scores where useful.
- Formula, raw, intermediate, component, and debug-like fields should remain internal.

## Top calibration candidates

### `rsi`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `11.3096`, p10 `32.4052`, p50 `48.3735`, p90 `68.5222`, p95 `72.9125`, max `98.911`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `rsi_attention_adjusted_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `19.6276`, p10 `40.1408`, p50 `50.0`, p90 `59.9948`, p95 `64.9257`, max `84.6668`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 75
  - `Extreme`: >= 75

### `rsi_attention_adjusted_score_ema_3`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `23.9862`, p10 `40.677`, p50 `50.0351`, p90 `59.8317`, p95 `62.2027`, max `78.4558`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 70
  - `Extreme`: >= 70

### `rsi_attention_adjusted_score_ema_7`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `27.6632`, p10 `42.6848`, p50 `50.318`, p90 `58.5649`, p95 `60.4223`, max `72.5565`
- Suggested labels:
  - `Quiet / Low`: < 45
  - `Baseline`: 45 to 55
  - `Active / Medium`: 55 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 80
  - `Extreme`: >= 80

### `rsi_attention_adjusted_score_streak_down`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `7.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `rsi_attention_adjusted_score_streak_up`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `11.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `rsi_attention_multiplier`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `1.0086`, p10 `1.0391`, p50 `1.0525`, p90 `1.075`, p95 `1.0844`, max `1.1518`
- Suggested labels:
  - `Quiet / Low`: < 1
  - `Baseline`: 1 to 1.1
  - `Active / Medium`: 1.1 to 11.1
  - `Elevated`: 11.1 to 21.1
  - `High`: 21.1 to 31.1
  - `Extreme`: >= 31.1

### `rsi_combined_strength_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `1.0`, p10 `33.3333`, p50 `50.0`, p90 `66.6667`, p95 `75.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 40
  - `Active / Medium`: 40 to 65
  - `Elevated`: 65 to 75
  - `High`: 75 to 85
  - `Extreme`: >= 85

### `rsi_combined_strength_score_ema_3`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `11.1559`, p10 `34.3755`, p50 `50.0`, p90 `66.5222`, p95 `69.8931`, max `91.984`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 70
  - `Extreme`: >= 70

### `rsi_combined_strength_score_ema_7`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `19.5612`, p10 `37.8854`, p50 `50.1991`, p90 `64.1709`, p95 `66.8913`, max `87.6429`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 75
  - `Extreme`: >= 75

### `rsi_combined_strength_score_raw`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `internal_only`
- Range: min `0.0`, p10 `33.3333`, p50 `50.0`, p90 `66.6667`, p95 `75.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 40
  - `Active / Medium`: 40 to 65
  - `Elevated`: 65 to 75
  - `High`: 75 to 85
  - `Extreme`: >= 85

### `rsi_combined_strength_score_streak_down`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `1.0`, p95 `1.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `rsi_combined_strength_score_streak_up`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `1.0`, p95 `1.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `rsi_strength_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `33.3333`, p50 `50.0`, p90 `66.6667`, p95 `66.6667`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 65
  - `Active / Medium`: 65 to 75
  - `Elevated`: 75 to 85
  - `High`: 85 to 95
  - `Extreme`: >= 95

### `signal_dispersion_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `19.2901`, p50 `38.656`, p90 `59.1664`, p95 `63.9836`, max `89.7019`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 30
  - `Active / Medium`: 30 to 50
  - `Elevated`: 50 to 60
  - `High`: 60 to 65
  - `Extreme`: >= 65

### `stochastic_rsi`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.6354`, p50 `53.0984`, p90 `99.8665`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0.6
  - `Baseline`: 0.6 to 17.5
  - `Active / Medium`: 17.5 to 85
  - `Elevated`: 85 to 100
  - `High`: 100 to 110
  - `Extreme`: >= 110

### `stochastic_rsi_cross_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `50.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 100
  - `Active / Medium`: 100 to 110
  - `Elevated`: 110 to 120
  - `High`: 120 to 130
  - `Extreme`: >= 130

### `stochastic_rsi_d`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `3.9038`, p50 `52.9822`, p90 `97.6185`, p95 `99.9511`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 3.9
  - `Baseline`: 3.9 to 20
  - `Active / Medium`: 20 to 85
  - `Elevated`: 85 to 100
  - `High`: 100 to 110
  - `Extreme`: >= 110

### `stochastic_rsi_d_strength_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `50.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 50
  - `Active / Medium`: 50 to 100
  - `Elevated`: 100 to 110
  - `High`: 110 to 120
  - `Extreme`: >= 120

### `stochastic_rsi_raw`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `internal_only`
- Range: min `0.0`, p10 `0.0`, p50 `52.9391`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 12.5
  - `Active / Medium`: 12.5 to 95
  - `Elevated`: 95 to 100
  - `High`: 100 to 110
  - `Extreme`: >= 110

### `stochastic_rsi_strength_score`

- Kind: `bounded_0_100_indicator`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `33.3333`, p50 `50.0`, p90 `66.6667`, p95 `83.3333`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 65
  - `Active / Medium`: 65 to 85
  - `Elevated`: 85 to 95
  - `High`: 95 to 105
  - `Extreme`: >= 105

### `attention_aligned_consensus_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `23.0791`, p10 `38.8852`, p50 `48.4842`, p90 `59.9403`, p95 `62.6501`, max `78.836`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 65
  - `Extreme`: >= 65

### `attention_aligned_consensus_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `28.6159`, p10 `41.2462`, p50 `48.7713`, p90 `57.2757`, p95 `59.5597`, max `76.2229`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 70
  - `Extreme`: >= 70

### `attention_aligned_consensus_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `31.6042`, p10 `42.2392`, p50 `48.8203`, p90 `56.1048`, p95 `57.9653`, max `71.6773`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 70
  - `Extreme`: >= 70

### `attention_aligned_consensus_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `1.0`, p90 `2.0`, p95 `3.0`, max `8.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `attention_aligned_consensus_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `12.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `attention_conviction_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `19.4662`, p10 `42.1318`, p50 `50.95`, p90 `62.1841`, p95 `66.2231`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 65
  - `Extreme`: >= 65

### `attention_conviction_score_signed_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `1.0`, p90 `3.0`, p95 `3.0`, max `10.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 3
  - `Elevated`: 3 to 13
  - `High`: 13 to 23
  - `Extreme`: >= 23

### `attention_conviction_score_signed_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `3.0`, p95 `3.0`, max `23.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 3
  - `Elevated`: 3 to 13
  - `High`: 13 to 23
  - `Extreme`: >= 23

### `attention_level_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `8.9182`, p50 `19.727`, p90 `37.6703`, p95 `43.9744`, max `90.0254`
- Suggested labels:
  - `Quiet / Low`: < 10
  - `Baseline`: 10 to 12.5
  - `Active / Medium`: 12.5 to 25
  - `Elevated`: 25 to 40
  - `High`: 40 to 45
  - `Extreme`: >= 45

### `attention_level_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `10.0049`, p50 `19.7873`, p90 `36.3046`, p95 `42.0974`, max `85.2481`
- Suggested labels:
  - `Quiet / Low`: < 10
  - `Baseline`: 10 to 15
  - `Active / Medium`: 15 to 25
  - `Elevated`: 25 to 35
  - `High`: 35 to 40
  - `Extreme`: >= 40

### `attention_level_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `10.8928`, p50 `19.9289`, p90 `34.7284`, p95 `40.5873`, max `81.0498`
- Suggested labels:
  - `Quiet / Low`: < 10
  - `Baseline`: 10 to 15
  - `Active / Medium`: 15 to 25
  - `Elevated`: 25 to 35
  - `High`: 35 to 40
  - `Extreme`: >= 40

### `attention_level_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `1.0`, p90 `3.0`, p95 `4.0`, max `33.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 2
  - `Active / Medium`: 2 to 3
  - `Elevated`: 3 to 4
  - `High`: 4 to 14
  - `Extreme`: >= 14

### `attention_level_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `9.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `attention_regime_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `12.9322`, p10 `20.8501`, p50 `26.4086`, p90 `36.5444`, p95 `41.0858`, max `74.2234`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 25
  - `Active / Medium`: 25 to 30
  - `Elevated`: 30 to 35
  - `High`: 35 to 40
  - `Extreme`: >= 40

### `attention_regime_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `15.4798`, p10 `21.3425`, p50 `26.4421`, p90 `35.8125`, p95 `39.9376`, max `72.5723`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 25
  - `Active / Medium`: 25 to 30
  - `Elevated`: 30 to 35
  - `High`: 35 to 40
  - `Extreme`: >= 40

### `attention_regime_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `17.4736`, p10 `21.855`, p50 `26.5834`, p90 `35.2294`, p95 `38.79`, max `65.5673`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 25
  - `Active / Medium`: 25 to 30
  - `Elevated`: 30 to 35
  - `High`: 35 to 40
  - `Extreme`: >= 40

### `attention_regime_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `1.0`, p90 `3.0`, p95 `4.0`, max `33.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 2
  - `Active / Medium`: 2 to 3
  - `Elevated`: 3 to 4
  - `High`: 4 to 14
  - `Extreme`: >= 14

### `attention_regime_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `9.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `boll_overlap_alert_quality_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `40.4032`, p95 `56.4526`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 7.5
  - `Active / Medium`: 7.5 to 40
  - `Elevated`: 40 to 55
  - `High`: 55 to 65
  - `Extreme`: >= 65

### `boll_overlap_signal_strength_abs`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `43.1981`, p95 `58.3541`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 15
  - `Active / Medium`: 15 to 45
  - `Elevated`: 45 to 60
  - `High`: 60 to 70
  - `Extreme`: >= 70

### `bollinger_attention_adjusted_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.6858`, p10 `31.427`, p50 `50.0`, p90 `80.151`, p95 `88.1601`, max `99.8088`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 90
  - `Extreme`: >= 90

### `bollinger_attention_adjusted_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `2.006`, p10 `35.7259`, p50 `50.0`, p90 `81.7304`, p95 `87.8076`, max `98.0296`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 90
  - `Extreme`: >= 90

### `bollinger_attention_adjusted_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `2.5242`, p10 `37.0227`, p50 `50.0581`, p90 `81.4632`, p95 `86.3384`, max `97.4417`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 85
  - `Extreme`: >= 85

### `bollinger_attention_adjusted_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `8.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `bollinger_attention_adjusted_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `12.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `bollinger_strength_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `30.0`, p50 `50.0`, p90 `80.0`, p95 `90.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 90
  - `Extreme`: >= 90

### `bollinger_strength_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0049`, p10 `35.0`, p50 `50.0`, p90 `83.1581`, p95 `89.9827`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 85
  - `High`: 85 to 90
  - `Extreme`: >= 90

### `bollinger_strength_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.4238`, p10 `37.0007`, p50 `50.0029`, p90 `83.0572`, p95 `88.4742`, max `99.9509`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 85
  - `High`: 85 to 90
  - `Extreme`: >= 90

### `bollinger_strength_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `1.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `bollinger_strength_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `1.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `combined_normalized_score_100`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.3484`, p10 `32.7858`, p50 `50.9444`, p90 `70.4082`, p95 `75.5661`, max `99.4575`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `combined_normalized_score_200`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `33.1931`, p50 `51.3453`, p90 `68.5989`, p95 `72.5701`, max `98.8887`
- Suggested labels:
  - `Quiet / Low`: < 35
  - `Baseline`: 35 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `combined_normalized_score_21`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `2.0295`, p10 `29.4251`, p50 `47.7358`, p90 `68.6409`, p95 `74.2438`, max `99.3375`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `combined_normalized_score_50`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `2.0656`, p10 `30.624`, p50 `49.542`, p90 `70.1513`, p95 `75.0739`, max `99.6223`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `combined_normalized_score_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.1412`, p10 `29.2208`, p50 `47.3073`, p90 `67.4879`, p95 `73.9016`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 75
  - `Extreme`: >= 75

### `consecutive_count_macd_price_divergence`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `0.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 10
  - `Active / Medium`: 10 to 20
  - `Elevated`: 20 to 30
  - `High`: 30 to 40
  - `Extreme`: >= 40

### `ma_attention_adjusted_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `3.7363`, p10 `8.4059`, p50 `50.0`, p90 `90.0037`, p95 `92.0681`, max `97.4853`
- Suggested labels:
  - `Quiet / Low`: < 7.5
  - `Baseline`: 7.5 to 20
  - `Active / Medium`: 20 to 75
  - `Elevated`: 75 to 90
  - `High`: 90 to 100
  - `Extreme`: >= 100

### `ma_attention_adjusted_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `6.176`, p10 `23.6452`, p50 `46.196`, p90 `69.2336`, p95 `75.3061`, max `91.9511`
- Suggested labels:
  - `Quiet / Low`: < 25
  - `Baseline`: 25 to 35
  - `Active / Medium`: 35 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `ma_attention_adjusted_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `9.3458`, p10 `30.1535`, p50 `46.1883`, p90 `61.7254`, p95 `66.6057`, max `85.795`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 40
  - `Active / Medium`: 40 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 65
  - `Extreme`: >= 65

### `ma_attention_adjusted_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `6.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `ma_attention_adjusted_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `6.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `ma_combined_strength_trend_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `30.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 12.5
  - `Active / Medium`: 12.5 to 90
  - `Elevated`: 90 to 100
  - `High`: 100 to 110
  - `Extreme`: >= 110

### `ma_combined_strength_trend_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `18.2557`, p50 `47.7823`, p90 `77.6236`, p95 `84.6571`, max `99.0102`
- Suggested labels:
  - `Quiet / Low`: < 17.5
  - `Baseline`: 17.5 to 30
  - `Active / Medium`: 30 to 65
  - `Elevated`: 65 to 80
  - `High`: 80 to 85
  - `Extreme`: >= 85

### `ma_combined_strength_trend_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `25.8809`, p50 `47.9647`, p90 `69.2353`, p95 `74.1321`, max `93.1149`
- Suggested labels:
  - `Quiet / Low`: < 25
  - `Baseline`: 25 to 35
  - `Active / Medium`: 35 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `ma_combined_strength_trend_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `1.0`, p95 `1.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `ma_combined_strength_trend_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `1.0`, p95 `1.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `ma_strength_breadth_count`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `3.0`, p90 `5.0`, p95 `5.0`, max `5.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 5
  - `Active / Medium`: 5 to 15
  - `Elevated`: 15 to 25
  - `High`: 25 to 35
  - `Extreme`: >= 35

### `ma_strength_distance_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `37.5`, p10 `41.8737`, p50 `50.1185`, p90 `57.5063`, p95 `59.0345`, max `62.5`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 55
  - `Elevated`: 55 to 60
  - `High`: 60 to 70
  - `Extreme`: >= 70

### `ma_strength_enhanced_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `16.875`, p10 `19.2713`, p50 `54.0524`, p90 `80.5279`, p95 `81.1297`, max `83.125`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 75
  - `Active / Medium`: 75 to 80
  - `Elevated`: 80 to 90
  - `High`: 90 to 100
  - `Extreme`: >= 100

### `ma_strength_enhanced_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `16.875`, p10 `20.1274`, p50 `50.539`, p90 `80.1952`, p95 `80.7956`, max `83.125`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 25
  - `Active / Medium`: 25 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 90
  - `Extreme`: >= 90

### `ma_strength_enhanced_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `16.875`, p10 `20.5752`, p50 `49.9989`, p90 `79.9399`, p95 `80.6536`, max `83.125`
- Suggested labels:
  - `Quiet / Low`: < 20
  - `Baseline`: 20 to 25
  - `Active / Medium`: 25 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 90
  - `Extreme`: >= 90

### `ma_strength_enhanced_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `8.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `ma_strength_enhanced_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `7.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `ma_strength_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `1.0`, p10 `1.0`, p50 `60.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 1
  - `Baseline`: 1 to 100
  - `Active / Medium`: 100 to 110
  - `Elevated`: 110 to 120
  - `High`: 120 to 130
  - `Extreme`: >= 130

### `ma_strength_score_raw`

- Kind: `bounded_0_100_score`
- Suggested exposure: `internal_only`
- Range: min `0.0`, p10 `0.0`, p50 `60.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 100
  - `Active / Medium`: 100 to 110
  - `Elevated`: 110 to 120
  - `High`: 120 to 130
  - `Extreme`: >= 130

### `ma_trend_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 100
  - `Active / Medium`: 100 to 110
  - `Elevated`: 110 to 120
  - `High`: 120 to 130
  - `Extreme`: >= 130

### `macd_attention_adjusted_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `19.0751`, p10 `40.1489`, p50 `59.4756`, p90 `79.7399`, p95 `88.4673`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 90
  - `Extreme`: >= 90

### `macd_attention_adjusted_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `23.6163`, p10 `40.0443`, p50 `59.1218`, p90 `78.7373`, p95 `83.1218`, max `96.0689`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 80
  - `High`: 80 to 85
  - `Extreme`: >= 85

### `macd_attention_adjusted_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `27.276`, p10 `42.8953`, p50 `59.247`, p90 `75.7609`, p95 `79.2373`, max `91.5734`
- Suggested labels:
  - `Quiet / Low`: < 45
  - `Baseline`: 45 to 50
  - `Active / Medium`: 50 to 70
  - `Elevated`: 70 to 75
  - `High`: 75 to 80
  - `Extreme`: >= 80

### `macd_attention_adjusted_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `8.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `macd_attention_adjusted_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `3.0`, max `8.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 3
  - `High`: 3 to 13
  - `Extreme`: >= 13

### `macd_attention_multiplier`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.8647`, p10 `0.9289`, p50 `0.9511`, p90 `0.9888`, p95 `1.0054`, max `1.1572`
- Suggested labels:
  - `Quiet / Low`: < 0.9
  - `Baseline`: 0.9 to 1
  - `Active / Medium`: 1 to 11
  - `Elevated`: 11 to 21
  - `High`: 21 to 31
  - `Extreme`: >= 31

### `macd_signal_strength_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `1.0`, p10 `25.0`, p50 `50.0`, p90 `75.0`, p95 `87.5`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 25
  - `Baseline`: 25 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 75
  - `High`: 75 to 90
  - `Extreme`: >= 90

### `macd_signal_strength_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `3.6213`, p10 `24.4246`, p50 `49.5473`, p90 `75.1859`, p95 `80.4407`, max `97.5072`
- Suggested labels:
  - `Quiet / Low`: < 25
  - `Baseline`: 25 to 35
  - `Active / Medium`: 35 to 65
  - `Elevated`: 65 to 75
  - `High`: 75 to 80
  - `Extreme`: >= 80

### `macd_signal_strength_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `7.859`, p10 `28.1914`, p50 `49.6487`, p90 `71.1156`, p95 `75.4589`, max `91.7395`
- Suggested labels:
  - `Quiet / Low`: < 30
  - `Baseline`: 30 to 40
  - `Active / Medium`: 40 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `macd_signal_strength_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `1.0`, p95 `2.0`, max `4.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `macd_signal_strength_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `1.0`, p95 `2.0`, max `5.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `sent_ribbon_regime_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `25.0`, p50 `54.6642`, p90 `77.0102`, p95 `82.1463`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 25
  - `Baseline`: 25 to 40
  - `Active / Medium`: 40 to 70
  - `Elevated`: 70 to 75
  - `High`: 75 to 80
  - `Extreme`: >= 80

### `sent_ribbon_stack_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `50.0`, p90 `100.0`, p95 `100.0`, max `100.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 25
  - `Active / Medium`: 25 to 75
  - `Elevated`: 75 to 100
  - `High`: 100 to 110
  - `Extreme`: >= 110

### `signal_consensus_attention_adjusted_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `19.7974`, p10 `37.8055`, p50 `52.6068`, p90 `69.565`, p95 `73.5107`, max `87.6881`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `signal_consensus_attention_adjusted_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `26.0804`, p10 `41.7161`, p50 `52.8782`, p90 `65.0705`, p95 `68.3236`, max `81.7949`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 70
  - `Extreme`: >= 70

### `signal_consensus_attention_adjusted_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `30.0814`, p10 `43.4459`, p50 `52.9479`, p90 `63.4336`, p95 `66.065`, max `75.1908`
- Suggested labels:
  - `Quiet / Low`: < 45
  - `Baseline`: 45 to 50
  - `Active / Medium`: 50 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 75
  - `Extreme`: >= 75

### `signal_consensus_attention_adjusted_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `1.0`, p90 `2.0`, p95 `2.0`, max `7.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `signal_consensus_attention_adjusted_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `12.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `signal_consensus_score`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `19.4777`, p10 `37.5517`, p50 `52.63`, p90 `69.9715`, p95 `73.6238`, max `88.1768`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 70
  - `High`: 70 to 75
  - `Extreme`: >= 75

### `signal_consensus_score_ema_3`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `25.2281`, p10 `41.4754`, p50 `52.9463`, p90 `65.2845`, p95 `68.6632`, max `81.3127`
- Suggested labels:
  - `Quiet / Low`: < 40
  - `Baseline`: 40 to 45
  - `Active / Medium`: 45 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 70
  - `Extreme`: >= 70

### `signal_consensus_score_ema_7`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `29.4132`, p10 `43.3178`, p50 `53.0012`, p90 `63.5678`, p95 `66.3847`, max `74.9728`
- Suggested labels:
  - `Quiet / Low`: < 45
  - `Baseline`: 45 to 50
  - `Active / Medium`: 50 to 60
  - `Elevated`: 60 to 65
  - `High`: 65 to 75
  - `Extreme`: >= 75

### `signal_consensus_score_streak_down`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `6.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `signal_consensus_score_streak_up`

- Kind: `bounded_0_100_score`
- Suggested exposure: `public_label_ok_raw_score_member_only`
- Range: min `0.0`, p10 `0.0`, p50 `0.0`, p90 `2.0`, p95 `2.0`, max `6.0`
- Suggested labels:
  - `Quiet / Low`: < 0
  - `Baseline`: 0 to 1
  - `Active / Medium`: 1 to 2
  - `Elevated`: 2 to 12
  - `High`: 12 to 22
  - `Extreme`: >= 22

### `macd_cross_significance`

- Kind: `numeric_other`
- Suggested exposure: `internal_review`
- Range: min `-2.9241`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `0.0`, max `0.0`

### `attention_aligned_consensus_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-22.9604`, p10 `-11.2618`, p50 `-0.11`, p90 `11.4826`, p95 `13.6335`, max `25.6802`

### `attention_aligned_consensus_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-28.4097`, p10 `-11.6489`, p50 `-0.0553`, p90 `11.5273`, p95 `14.6894`, max `33.9189`

### `attention_level_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-32.3695`, p10 `-6.8565`, p50 `-0.129`, p90 `6.5907`, p95 `9.8389`, max `42.852`

### `attention_level_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-40.8781`, p10 `-10.7539`, p50 `-0.2892`, p90 `11.2693`, p95 `16.3683`, max `70.1605`

### `attention_regime_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-19.0321`, p10 `-3.8736`, p50 `-0.0513`, p90 `3.5971`, p95 `5.4869`, max `27.3277`

### `attention_regime_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-24.2116`, p10 `-6.1184`, p50 `-0.0844`, p90 `6.2214`, p95 `9.2355`, max `45.7573`

### `boll_overlap_signal_strength`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-100.0`, p10 `0.0`, p50 `0.0`, p90 `31.8261`, p95 `49.7884`, max `100.0`

### `bollinger_attention_adjusted_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-48.8172`, p10 `-0.937`, p50 `0.0`, p90 `1.5132`, p95 `9.6009`, max `67.8632`

### `bollinger_attention_adjusted_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-75.6844`, p10 `-9.5395`, p50 `0.0`, p90 `9.4993`, p95 `18.8056`, max `77.1148`

### `bollinger_strength_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-50.0`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `10.0`, max `70.0`

### `bollinger_strength_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-80.0`, p10 `-10.0`, p50 `0.0`, p90 `10.0`, p95 `20.0`, max `80.0`

### `combined_macd_histogram`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-1929.8991`, p10 `-3.2562`, p50 `0.0013`, p90 `4.2901`, p95 `13.5782`, max `1131.1233`

### `combined_macd_histogram_acceleration_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-1889.8394`, p10 `-5.506`, p50 `-0.0008`, p90 `5.2589`, p95 `18.6713`, max `1976.134`

### `combined_macd_histogram_slope_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-1518.8992`, p10 `-3.4177`, p50 `-0.0001`, p90 `3.4083`, p95 `11.7825`, max `1224.2999`

### `combined_macd_signal`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-4914.7695`, p10 `-17.4279`, p50 `-0.0152`, p90 `11.7646`, p95 `23.048`, max `2905.9114`

### `ma_attention_adjusted_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-85.6874`, p10 `-64.0877`, p50 `0.0`, p90 `64.0763`, p95 `67.1846`, max `85.3666`

### `ma_attention_adjusted_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-88.5947`, p10 `-63.4143`, p50 `0.0`, p90 `63.4486`, p95 `66.2339`, max `86.3846`

### `ma_combined_strength_trend_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-100.0`, p10 `-70.0`, p50 `0.0`, p90 `74.8`, p95 `76.0`, max `100.0`

### `ma_combined_strength_trend_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-100.0`, p10 `-70.0`, p50 `0.0`, p90 `70.0`, p95 `76.0`, max `100.0`

### `ma_strength_distance_score_raw`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-0.5`, p10 `-0.3251`, p50 `0.0047`, p90 `0.3003`, p95 `0.3614`, max `0.5`

### `ma_strength_enhanced_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-63.0591`, p10 `-12.2489`, p50 `0.0`, p90 `12.4451`, p95 `23.636`, max `63.8543`

### `ma_strength_enhanced_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-62.9713`, p10 `-12.8579`, p50 `0.0`, p90 `12.8516`, p95 `24.2666`, max `62.6519`

### `macd`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-5921.213`, p10 `-11.1563`, p50 `-0.0045`, p90 `10.7633`, p95 `25.8224`, max `3404.0272`

### `macd_acceleration_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-2146.7555`, p10 `-2.8633`, p50 `0.0`, p90 `3.0678`, p95 `7.5317`, max `1714.6513`

### `macd_attention_adjusted_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-58.6091`, p10 `-19.1355`, p50 `0.0`, p90 `19.2037`, p95 `28.344`, max `57.88`

### `macd_attention_adjusted_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-59.2913`, p10 `-28.0333`, p50 `0.0`, p90 `28.1329`, p95 `29.6815`, max `59.6885`

### `macd_component_divergence`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-0.5`, p10 `-0.5`, p50 `0.0`, p90 `0.5`, p95 `0.5`, max `0.5`

### `macd_component_price_trend`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-0.5`, p10 `-0.5`, p50 `0.0`, p90 `0.5`, p95 `0.5`, max `0.5`

### `macd_histogram`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-2254.1175`, p10 `-2.89`, p50 `0.0105`, p90 `3.7662`, p95 `10.4684`, max `1284.9444`

### `macd_histogram_acceleration_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-1327.8816`, p10 `-2.3643`, p50 `-0.0005`, p90 `2.3667`, p95 `6.0988`, max `1620.912`

### `macd_histogram_slope_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-1612.3444`, p10 `-1.8454`, p50 `0.0002`, p90 `2.0256`, p95 `5.2441`, max `1068.1694`

### `macd_signal`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-5264.8134`, p10 `-10.7672`, p50 `-0.0066`, p90 `10.005`, p95 `24.247`, max `2905.9114`

### `macd_signal_cross`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-1.0`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `0.0`, max `1.0`

### `macd_signal_difference`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-3389.9335`, p10 `-23.8573`, p50 `0.0071`, p90 `24.295`, p95 `142.7723`, max `6025.455`

### `macd_signal_difference_mean`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-2857.4488`, p10 `-23.9302`, p50 `-0.0007`, p90 `24.1338`, p95 `146.4467`, max `5666.7996`

### `macd_signal_difference_std_deviation`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-3.0493`, p10 `-1.8349`, p50 `0.1599`, p90 `1.8424`, p95 `2.0644`, max `2.8339`

### `macd_signal_strength_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-75.0`, p10 `-25.0`, p50 `0.0`, p90 `25.0`, p95 `37.5`, max `75.0`

### `macd_signal_strength_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-75.0`, p10 `-37.5`, p50 `0.0`, p90 `37.5`, p95 `37.5`, max `75.0`

### `macd_signal_strength_score_raw`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-1.5`, p10 `-0.5`, p50 `0.5`, p90 `1.5`, p95 `2.0`, max `2.5`

### `macd_signal_trend_reversal`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-3.0493`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `2.0536`, max `2.8339`

### `macd_slope_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-2185.4689`, p10 `-2.8425`, p50 `0.0061`, p90 `3.6061`, p95 `10.3751`, max `1564.816`

### `rsi_acceleration_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-56.507`, p10 `-13.4508`, p50 `0.0`, p90 `13.3957`, p95 `17.8776`, max `56.9559`

### `rsi_attention_adjusted_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-30.0686`, p10 `-9.2742`, p50 `0.0`, p90 `9.2574`, p95 `10.6211`, max `39.3369`

### `rsi_attention_adjusted_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-46.5151`, p10 `-10.589`, p50 `0.0`, p90 `10.6066`, p95 `16.1124`, max `45.1494`

### `rsi_combined_strength_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-50.0`, p10 `-16.6667`, p50 `0.0`, p90 `16.6667`, p95 `16.6667`, max `65.6667`

### `rsi_combined_strength_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-66.6667`, p10 `-16.6667`, p50 `0.0`, p90 `16.6667`, p95 `25.0`, max `66.6667`

### `rsi_component_both_extreme`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-0.5`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `0.0`, max `0.5`

### `rsi_component_compare`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-0.5`, p10 `-0.5`, p50 `0.5`, p90 `0.5`, p95 `0.5`, max `0.5`

### `rsi_component_divergence`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-1.5`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `0.0`, max `1.5`

### `rsi_component_level`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-1.0`, p10 `-1.0`, p50 `0.0`, p90 `1.0`, p95 `1.0`, max `1.0`

### `rsi_component_zone`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-1.0`, p10 `0.0`, p50 `0.0`, p90 `0.0`, p95 `0.0`, max `1.0`

### `rsi_difference`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-47.9959`, p10 `-18.3237`, p50 `-2.1067`, p90 `19.518`, p95 `25.0187`, max `67.2155`

### `rsi_difference_mean`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-40.8849`, p10 `-15.9887`, p50 `-1.9882`, p90 `16.7883`, p95 `21.1004`, max `45.4268`

### `rsi_difference_std_deviation`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-3.3448`, p10 `-1.5116`, p50 `0.0301`, p90 `1.5818`, p95 `1.8991`, max `3.2828`

### `rsi_slope_3`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-43.581`, p10 `-8.8412`, p50 `0.0`, p90 `9.1512`, p95 `12.2614`, max `45.7527`

### `rsi_strength_score_raw`

- Kind: `signed_numeric`
- Suggested exposure: `internal_only`
- Range: min `-2.0`, p10 `-0.5`, p50 `0.0`, p90 `0.5`, p95 `0.5`, max `2.0`

### `signal_consensus_attention_adjusted_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-37.0537`, p10 `-18.4768`, p50 `-0.0122`, p90 `18.5407`, p95 `21.8666`, max `33.1413`

### `signal_consensus_attention_adjusted_score_delta_3d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-48.5107`, p10 `-18.3625`, p50 `-0.0367`, p90 `18.1039`, p95 `22.8271`, max `44.3176`

### `signal_consensus_score_delta_1d`

- Kind: `signed_numeric`
- Suggested exposure: `internal_review`
- Range: min `-36.8527`, p10 `-18.8149`, p50 `0.0`, p90 `18.8182`, p95 `22.2706`, max `34.3536`
