import React from 'react';
import {
  chart_color_blue_100 as chartColorBlueLight,
  chart_color_blue_300 as chartColorBlueDark
} from '@patternfly/react-tokens';
import { Button } from '@patternfly/react-core';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import moment from 'moment/moment';
import {
  RHSM_API_PATH_METRIC_TYPES,
  RHSM_API_PATH_PRODUCT_TYPES,
  RHSM_API_QUERY_CATEGORY_TYPES as CATEGORY_TYPES,
  RHSM_API_QUERY_GRANULARITY_TYPES as GRANULARITY_TYPES,
  RHSM_API_QUERY_INVENTORY_SORT_DIRECTION_TYPES as SORT_DIRECTION_TYPES,
  RHSM_API_QUERY_INVENTORY_SORT_TYPES as INVENTORY_SORT_TYPES,
  RHSM_API_QUERY_INVENTORY_SUBSCRIPTIONS_SORT_TYPES as SUBSCRIPTIONS_SORT_TYPES,
  RHSM_API_QUERY_SET_TYPES,
  RHSM_API_RESPONSE_INSTANCES_DATA_TYPES as INVENTORY_TYPES,
  RHSM_API_RESPONSE_SUBSCRIPTIONS_DATA_TYPES as SUBSCRIPTIONS_INVENTORY_TYPES,
  RHSM_INTERNAL_PRODUCT_DISPLAY_TYPES as DISPLAY_TYPES
} from '../services/rhsm/rhsmConstants';
import { dateHelpers, helpers } from '../common';
import { ChartTypeVariant } from '../components/chart/chartHelpers';
import { SelectPosition } from '../components/form/select';
import { translate } from '../components/i18n/i18n';

/**
 * Ansible
 *
 * @memberof Products
 * @module Ansible
 */

/**
 * Product group. A variant and dissimilar product configuration grouping identifier.
 *
 * @type {string}
 */
const productGroup = RHSM_API_PATH_PRODUCT_TYPES.ANSIBLE;

/**
 * Product ID. The identifier used when querying the API.
 *
 * @type {string}
 */
const productId = RHSM_API_PATH_PRODUCT_TYPES.ANSIBLE;

/**
 * Product label. An identifier used for display strings.
 *
 * @type {string}
 */
const productLabel = RHSM_API_PATH_PRODUCT_TYPES.ANSIBLE;

/**
 * Product configuration
 *
 * @type {{productLabel: string, productPath: string, aliases: string[], productId: string,
 *     inventorySubscriptionsQuery: object, query: object, initialSubscriptionsInventoryFilters: Array,
 *     initialInventorySettings: object, viewId: string, initialToolbarFilters: Array, productGroup: string,
 *     graphTallyQuery: object, inventoryHostsQuery: object, productDisplay: string, initialGraphFilters: Array,
 *     initialGuestsFilters: Array, inventoryGuestsQuery: object, initialGraphSettings: object,
 *     initialInventoryFilters: Array}}
 */
const config = {
  aliases: [],
  productGroup,
  productId,
  productLabel,
  productPath: productGroup.toLowerCase(),
  productDisplay: DISPLAY_TYPES.CAPACITY,
  viewId: `view${productGroup}-${productId}`,
  query: {
    [RHSM_API_QUERY_SET_TYPES.START_DATE]: dateHelpers.getRangedMonthDateTime('current').value.startDate.toISOString(),
    [RHSM_API_QUERY_SET_TYPES.END_DATE]: dateHelpers.getRangedMonthDateTime('current').value.endDate.toISOString()
  },
  graphTallyQuery: {
    [RHSM_API_QUERY_SET_TYPES.GRANULARITY]: GRANULARITY_TYPES.DAILY,
    [RHSM_API_QUERY_SET_TYPES.USE_RUNNING_TOTALS_FORMAT]: true
  },
  inventoryGuestsQuery: {
    [RHSM_API_QUERY_SET_TYPES.LIMIT]: 100,
    [RHSM_API_QUERY_SET_TYPES.OFFSET]: 0
  },
  inventoryHostsQuery: {
    [RHSM_API_QUERY_SET_TYPES.SORT]: INVENTORY_SORT_TYPES.LAST_SEEN,
    [RHSM_API_QUERY_SET_TYPES.DIRECTION]: SORT_DIRECTION_TYPES.DESCENDING,
    [RHSM_API_QUERY_SET_TYPES.LIMIT]: 100,
    [RHSM_API_QUERY_SET_TYPES.OFFSET]: 0
  },
  inventorySubscriptionsQuery: {
    [RHSM_API_QUERY_SET_TYPES.SORT]: SUBSCRIPTIONS_SORT_TYPES.NEXT_EVENT_DATE,
    [RHSM_API_QUERY_SET_TYPES.DIRECTION]: SORT_DIRECTION_TYPES.DESCENDING,
    [RHSM_API_QUERY_SET_TYPES.LIMIT]: 100,
    [RHSM_API_QUERY_SET_TYPES.OFFSET]: 0
  },
  initialGraphFilters: [
    {
      filters: [
        {
          metric: RHSM_API_PATH_METRIC_TYPES.MANAGED_NODES,
          fill: chartColorBlueLight.value,
          stroke: chartColorBlueDark.value,
          color: chartColorBlueDark.value,
          chartType: ChartTypeVariant.line,
          query: {
            [RHSM_API_QUERY_SET_TYPES.BILLING_CATEGORY]: CATEGORY_TYPES.PREPAID
          }
        },
        {
          metric: RHSM_API_PATH_METRIC_TYPES.MANAGED_NODES,
          chartType: ChartTypeVariant.threshold
        }
      ]
    },
    {
      filters: [
        {
          metric: RHSM_API_PATH_METRIC_TYPES.INSTANCE_HOURS,
          fill: chartColorBlueLight.value,
          stroke: chartColorBlueDark.value,
          color: chartColorBlueDark.value,
          chartType: ChartTypeVariant.line,
          query: {
            [RHSM_API_QUERY_SET_TYPES.BILLING_CATEGORY]: CATEGORY_TYPES.PREPAID
          }
        },
        {
          metric: RHSM_API_PATH_METRIC_TYPES.INSTANCE_HOURS,
          chartType: ChartTypeVariant.threshold
        }
      ]
    }
  ],
  initialGraphSettings: {
    cards: [
      {
        header: ({ dataSets = [] } = {}) =>
          translate('curiosity-graph.cardHeadingMetric', {
            context: ['remainingCapacity', dataSets?.[0]?.display?.chartId],
            testId: 'graphRemainingCapacityCard-header'
          }),
        body: ({ dataSets = [] } = {}) =>
          translate(
            'curiosity-graph.cardBodyMetric',
            {
              context: ['total', dataSets?.[0]?.display?.remainingCapacityHasData && dataSets?.[0]?.display?.chartId],
              testId: 'graphRemainingCapacityCard-body',
              total: helpers
                .numberDisplay(dataSets?.[0]?.display?.remainingCapacity)
                ?.format({
                  average: true,
                  mantissa: 2,
                  trimMantissa: true,
                  lowPrecision: false
                })
                ?.toUpperCase()
            },
            [
              <strong
                title={dataSets?.[0]?.display?.remainingCapacity}
                aria-label={dataSets?.[0]?.display?.remainingCapacity}
              />
            ]
          ),
        footer: ({ dataSets = [] } = {}) =>
          translate('curiosity-graph.cardFooterMetric', {
            date: moment
              .utc(dataSets?.[0]?.display?.dailyDate)
              .format(dateHelpers.timestampUTCTimeFormats.yearTimeShort),
            testId: 'graphRemainingCapacityCard-footer'
          })
      }
    ],
    isCardTitleDescription: true,
    xAxisLabelIncrement: 1,
    xAxisChartLabel: () => translate('curiosity-graph.label_axisX', { context: GRANULARITY_TYPES.DAILY }),
    xAxisTickFormat: ({ tick }) => Number.parseInt(tick, 10) + 1 || tick,
    yAxisTickFormat: ({ tick } = {}) => {
      if (tick > 1) {
        return helpers
          .numberDisplay(tick)
          ?.format({ average: true, mantissa: 1, trimMantissa: true, lowPrecision: false })
          ?.toUpperCase();
      }
      return helpers
        .numberDisplay(tick)
        ?.format({ average: true, mantissa: 5, trimMantissa: true, lowPrecision: true })
        ?.toUpperCase();
    }
  },
  initialGuestsFilters: [
    {
      metric: INVENTORY_TYPES.DISPLAY_NAME,
      header: () => translate('curiosity-inventory.guestsHeader', { context: [INVENTORY_TYPES.DISPLAY_NAME] }),
      cell: ({ [INVENTORY_TYPES.DISPLAY_NAME]: displayName, [INVENTORY_TYPES.INVENTORY_ID]: inventoryId } = {}) => {
        // FixMe: Disabled, see SWATCH-1209 for resolution
        const { inventory: authorized = false } = {};

        if (!inventoryId) {
          return displayName;
        }

        let updatedDisplayName = displayName || inventoryId;

        if (authorized) {
          updatedDisplayName = (
            <Button
              isInline
              component="a"
              variant="link"
              href={`${helpers.UI_DEPLOY_PATH_LINK_PREFIX}/insights/inventory/${inventoryId}/`}
            >
              {updatedDisplayName}
            </Button>
          );
        }

        return updatedDisplayName;
      }
    },
    {
      metric: INVENTORY_TYPES.INVENTORY_ID,
      width: 40
    },
    {
      metric: INVENTORY_TYPES.LAST_SEEN,
      cell: ({ [INVENTORY_TYPES.LAST_SEEN]: lastSeen } = {}) => (lastSeen && <DateFormat date={lastSeen} />) || '',
      width: 15
    }
  ],
  initialInventoryFilters: [
    {
      metric: INVENTORY_TYPES.DISPLAY_NAME,
      cell: (
        { [INVENTORY_TYPES.DISPLAY_NAME]: displayName, [INVENTORY_TYPES.INSTANCE_ID]: instanceId } = {},
        session
      ) => {
        const { inventory: authorized } = session?.authorized || {};

        if (!instanceId) {
          return displayName;
        }

        let updatedDisplayName = displayName || instanceId;

        if (authorized) {
          updatedDisplayName = (
            <Button
              isInline
              component="a"
              variant="link"
              href={`${helpers.UI_DEPLOY_PATH_LINK_PREFIX}/openshift/details/${instanceId}/`}
            >
              {updatedDisplayName}
            </Button>
          );
        }

        return updatedDisplayName;
      },
      isSort: true
    },
    {
      metric: INVENTORY_TYPES.LAST_SEEN,
      cell: ({ [INVENTORY_TYPES.LAST_SEEN]: lastSeen }) => (lastSeen && <DateFormat date={lastSeen} />) || '',
      isSort: true,
      isWrap: true,
      width: 15
    }
  ],
  initialInventorySettings: {
    actions: [
      {
        id: RHSM_API_QUERY_SET_TYPES.DISPLAY_NAME
      }
    ],
    guestContent: ({
      [INVENTORY_TYPES.NUMBER_OF_GUESTS]: numberOfGuests = {},
      [INVENTORY_TYPES.INSTANCE_ID]: id
    } = {}) => (numberOfGuests > 0 && id && { id, numberOfGuests }) || undefined
  },
  initialSubscriptionsInventoryFilters: [
    {
      metric: SUBSCRIPTIONS_INVENTORY_TYPES.PRODUCT_NAME,
      isSort: true,
      isWrap: true
    },
    {
      metric: SUBSCRIPTIONS_INVENTORY_TYPES.QUANTITY,
      cell: ({ [SUBSCRIPTIONS_INVENTORY_TYPES.QUANTITY]: total } = {}) =>
        translate('curiosity-inventory.measurement', {
          context: (total && 'value') || undefined,
          total,
          testId: (
            <span data-test={`subscriptions-cell-${SUBSCRIPTIONS_INVENTORY_TYPES.QUANTITY}`} data-value={`${total}`} />
          )
        }),
      isSort: true,
      isWrap: true,
      width: 10
    },
    {
      metric: SUBSCRIPTIONS_INVENTORY_TYPES.NEXT_EVENT_DATE,
      cell: ({ [SUBSCRIPTIONS_INVENTORY_TYPES.NEXT_EVENT_DATE]: nextEventDate } = {}) =>
        (nextEventDate && moment.utc(nextEventDate).format('YYYY-MM-DD')) || '',
      isSort: true,
      isWrap: true,
      width: 15
    }
  ],
  initialToolbarFilters: [
    {
      id: 'rangedMonthly',
      isSecondary: true,
      position: SelectPosition.right
    },
    {
      id: 'export',
      isItem: true
    }
  ]
};

export { config as default, config, productGroup, productId };
