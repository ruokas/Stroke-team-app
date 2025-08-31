# Analytics KPIs

This document outlines key performance indicators (KPIs) tracked by the Stroke Team app, along with the data fields from which they are calculated.

## Door-to-Needle Time

- **Description**: Time from patient arrival at the hospital to the initiation of thrombolysis treatment.
- **Data Fields**:
  - Door time (`#t_door`)
  - Thrombolysis start (`#t_thrombolysis`)
- **Calculation**: `thrombolysis start - door time`
- **Target Threshold**: < 60 minutes
- **Example**:
  ```javascript
  const door = new Date(document.querySelector('#t_door').value);
  const needle = new Date(document.querySelector('#t_thrombolysis').value);
  const dtnMinutes = (needle - door) / 60000;
  ```

## Door-to-Decision Time

- **Description**: Interval from arrival to documented treatment decision.
- **Data Fields**:
  - Door time (`#t_door`)
  - Decision time (`#d_time`)
- **Calculation**: `decision time - door time`
- **Target Threshold**: < 45 minutes
- **Example**:
  ```javascript
  const door = new Date($('#t_door').value);
  const decision = new Date($('#d_time').value);
  const doorToDecision = (decision - door) / 60000;
  ```

## Last Known Well to Door

- **Description**: Elapsed time between when the patient was last known well and arrival.
- **Data Fields**:
  - Last known well (`#t_lkw`)
  - Door time (`#t_door`)
- **Calculation**: `door time - last known well`
- **Target Threshold**: < 4.5 hours
- **Example**:
  ```javascript
  const lkw = new Date($('#t_lkw').value);
  const door = new Date($('#t_door').value);
  const onsetToDoor = (door - lkw) / 60000;
  ```

## Initial Blood Pressure within Range

- **Description**: Whether initial systolic and diastolic blood pressure values fall below tPA eligibility thresholds.
- **Data Fields**:
  - Systolic BP (`#p_bp_sys`)
  - Diastolic BP (`#p_bp_dia`)
- **Calculation**: Check if `systolic < 185` **and** `diastolic < 110`.
- **Target Threshold**: Yes (both values within range)
- **Example**:
  ```javascript
  const sys = parseInt($('#p_bp_sys').value, 10);
  const dia = parseInt($('#p_bp_dia').value, 10);
  const eligible = sys < 185 && dia < 110;
  ```
