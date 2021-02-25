import React from 'react';
import PropTypes from 'prop-types';
import {
  chart_color_blue_100 as chartColorBlueLight,
  chart_color_blue_300 as chartColorBlueDark
} from '@patternfly/react-tokens';
import { Button, Label as PfLabel } from '@patternfly/react-core';
import { DateFormat } from '@redhat-cloud-services/frontend-components/components/DateFormat';
import moment from 'moment';
import { PageLayout, PageHeader, PageMessages, PageSection, PageToolbar } from '../pageLayout/pageLayout';
import {
  RHSM_API_QUERY_SORT_DIRECTION_TYPES as SORT_DIRECTION_TYPES,
  RHSM_API_QUERY_GRANULARITY_TYPES as GRANULARITY_TYPES,
  RHSM_API_QUERY_TYPES,
  RHSM_API_QUERY_UOM_TYPES,
  RHSM_API_QUERY_SORT_TYPES,
  RHSM_API_QUERY_SUBSCRIPTIONS_SORT_TYPES
} from '../../types/rhsmApiTypes';
import { apiQueries, connect, reduxSelectors } from '../../redux';
import GraphCard from '../graphCard/graphCard';
import { ToolbarFieldUom } from '../toolbar/toolbarFieldUom';
import { ToolbarFieldGranularity } from '../toolbar/toolbarFieldGranularity';
import Toolbar from '../toolbar/toolbar';
import InventoryList from '../inventoryList/inventoryList';
import InventorySubscriptions from '../inventorySubscriptions/inventorySubscriptions';
import InventoryTabs, { InventoryTab } from '../inventoryTabs/inventoryTabs';
import BannerMessages from '../bannerMessages/bannerMessages';
import { helpers, dateHelpers } from '../../common';
import { translate } from '../i18n/i18n';

/**
 * An OpenShift encompassing view.
 *
 * @augments React.Component
 * @fires onSelect
 */
class OpenshiftView extends React.Component {
  componentDidMount() {}

  /**
   * Render an OpenShift view.
   *
   * @returns {Node}
   */
  render() {
    const {
      initialGuestsFilters,
      initialToolbarFilters,
      initialInventorySettings,
      initialGraphFilters,
      initialInventoryFilters,
      initialSubscriptionsInventoryFilters,
      initialOption,
      query,
      graphTallyQuery,
      inventoryHostsQuery,
      inventorySubscriptionsQuery,
      routeDetail,
      t,
      viewId
    } = this.props;
    const { pathParameter: productId, productParameter: productLabel } = routeDetail;
    const {
      graphTallyQuery: initialGraphTallyQuery,
      inventoryHostsQuery: initialInventoryHostsQuery,
      inventorySubscriptionsQuery: initialInventorySubscriptionsQuery,
      toolbarQuery
    } = apiQueries.parseRhsmQuery(query, { graphTallyQuery, inventoryHostsQuery, inventorySubscriptionsQuery });

    const uomFilter = query[RHSM_API_QUERY_TYPES.UOM] || initialOption;
    const filter = ({ id, isOptional }) => {
      if (!isOptional) {
        return true;
      }
      return new RegExp(uomFilter, 'i').test(id);
    };

    const graphFilters = initialGraphFilters.filter(filter);
    const inventoryFilters = initialInventoryFilters.filter(filter);
    const subscriptionsInventoryFilters = initialSubscriptionsInventoryFilters.filter(filter);

    return (
      <PageLayout>
        <PageHeader productLabel={productLabel} includeTour>
          {t(`curiosity-view.title`, { appName: helpers.UI_DISPLAY_NAME, context: productLabel })}
        </PageHeader>
        <PageMessages>
          <BannerMessages productId={productId} viewId={viewId} query={query} />
        </PageMessages>
        <PageToolbar>
          <Toolbar filterOptions={initialToolbarFilters} productId={productId} query={toolbarQuery} viewId={viewId} />
        </PageToolbar>
        <PageSection>
          <GraphCard
            key={`graph_${productId}`}
            filterGraphData={graphFilters}
            query={initialGraphTallyQuery}
            productId={productId}
            viewId={viewId}
            cardTitle={t('curiosity-graph.cardHeading', { context: uomFilter })}
            productLabel={productLabel}
          >
            <ToolbarFieldUom value={initialOption} viewId={viewId} />
            <ToolbarFieldGranularity value={initialGraphTallyQuery[RHSM_API_QUERY_TYPES.GRANULARITY]} viewId={viewId} />
          </GraphCard>
        </PageSection>
        <PageSection>
          <InventoryTabs key={`inventory_${productId}`} productId={productId}>
            <InventoryTab
              key={`inventory_hosts_${productId}`}
              title={t('curiosity-inventory.tab', { context: 'hosts' })}
            >
              <InventoryList
                key={productId}
                filterGuestsData={initialGuestsFilters}
                filterInventoryData={inventoryFilters}
                productId={productId}
                settings={initialInventorySettings}
                query={initialInventoryHostsQuery}
                viewId={viewId}
              />
            </InventoryTab>
            {!helpers.UI_DISABLED_TABLE_SUBSCRIPTIONS && (
              <InventoryTab
                key={`inventory_subs_${productId}`}
                title={t('curiosity-inventory.tab', { context: 'subscriptions' })}
              >
                <InventorySubscriptions
                  key={productId}
                  filterInventoryData={subscriptionsInventoryFilters}
                  productId={productId}
                  query={initialInventorySubscriptionsQuery}
                  viewId={viewId}
                />
              </InventoryTab>
            )}
          </InventoryTabs>
        </PageSection>
      </PageLayout>
    );
  }
}

/**
 * Prop types.
 *
 * @type {{initialOption: string, inventorySubscriptionsQuery: object, query: object,
 *     initialSubscriptionsInventoryFilters: Array, initialInventorySettings: object, initialToolbarFilters: Array,
 *     t: Function, graphTallyQuery: object, inventoryHostsQuery: object, initialGraphFilters: Array,
 *     routeDetail: object, initialGuestsFilters: Array, initialInventoryFilters: Array, viewId: string}}
 */
OpenshiftView.propTypes = {
  query: PropTypes.object,
  graphTallyQuery: PropTypes.shape({
    [RHSM_API_QUERY_TYPES.GRANULARITY]: PropTypes.oneOf([...Object.values(GRANULARITY_TYPES)]),
    [RHSM_API_QUERY_TYPES.START_DATE]: PropTypes.string,
    [RHSM_API_QUERY_TYPES.END_DATE]: PropTypes.string
  }),
  inventoryHostsQuery: PropTypes.shape({
    [RHSM_API_QUERY_TYPES.LIMIT]: PropTypes.number,
    [RHSM_API_QUERY_TYPES.OFFSET]: PropTypes.number,
    [RHSM_API_QUERY_TYPES.SORT]: PropTypes.oneOf([...Object.values(RHSM_API_QUERY_SORT_TYPES)]),
    [RHSM_API_QUERY_TYPES.DIRECTION]: PropTypes.oneOf([...Object.values(SORT_DIRECTION_TYPES)])
  }),
  inventorySubscriptionsQuery: PropTypes.shape({
    [RHSM_API_QUERY_TYPES.LIMIT]: PropTypes.number,
    [RHSM_API_QUERY_TYPES.OFFSET]: PropTypes.number,
    [RHSM_API_QUERY_TYPES.SORT]: PropTypes.oneOf([...Object.values(RHSM_API_QUERY_SUBSCRIPTIONS_SORT_TYPES)]),
    [RHSM_API_QUERY_TYPES.DIRECTION]: PropTypes.oneOf([...Object.values(SORT_DIRECTION_TYPES)])
  }),
  initialOption: PropTypes.oneOf(Object.values(RHSM_API_QUERY_UOM_TYPES)),
  initialGraphFilters: PropTypes.array,
  initialGuestsFilters: PropTypes.array,
  initialInventoryFilters: PropTypes.array,
  initialInventorySettings: PropTypes.shape({
    hasGuests: PropTypes.func
  }),
  initialSubscriptionsInventoryFilters: PropTypes.array,
  initialToolbarFilters: PropTypes.array,
  routeDetail: PropTypes.shape({
    pathParameter: PropTypes.string,
    productParameter: PropTypes.string,
    viewParameter: PropTypes.string
  }).isRequired,
  t: PropTypes.func,
  viewId: PropTypes.string
};

/**
 * Default props.
 *
 * @type {{initialOption: string, inventorySubscriptionsQuery: object, query: object,
 *     initialSubscriptionsInventoryFilters: Array, initialInventorySettings: object, initialToolbarFilters: Array,
 *     t: translate, graphTallyQuery: object, inventoryHostsQuery: object,
 *     initialGraphFilters: Array, initialGuestsFilters: Array, initialInventoryFilters: Array, viewId: string}}
 */
OpenshiftView.defaultProps = {
  query: {
    [RHSM_API_QUERY_TYPES.UOM]: RHSM_API_QUERY_UOM_TYPES.CORES
  },
  graphTallyQuery: {
    [RHSM_API_QUERY_TYPES.GRANULARITY]: GRANULARITY_TYPES.DAILY,
    [RHSM_API_QUERY_TYPES.START_DATE]: dateHelpers.getRangedDateTime(GRANULARITY_TYPES.DAILY).startDate.toISOString(),
    [RHSM_API_QUERY_TYPES.END_DATE]: dateHelpers.getRangedDateTime(GRANULARITY_TYPES.DAILY).endDate.toISOString()
  },
  inventoryHostsQuery: {
    [RHSM_API_QUERY_TYPES.SORT]: RHSM_API_QUERY_SORT_TYPES.LAST_SEEN,
    [RHSM_API_QUERY_TYPES.DIRECTION]: SORT_DIRECTION_TYPES.ASCENDING,
    [RHSM_API_QUERY_TYPES.LIMIT]: 100,
    [RHSM_API_QUERY_TYPES.OFFSET]: 0
  },
  inventorySubscriptionsQuery: {
    [RHSM_API_QUERY_TYPES.SORT]: RHSM_API_QUERY_SUBSCRIPTIONS_SORT_TYPES.UPCOMING_EVENT_DATE,
    [RHSM_API_QUERY_TYPES.DIRECTION]: SORT_DIRECTION_TYPES.ASCENDING,
    [RHSM_API_QUERY_TYPES.LIMIT]: 100,
    [RHSM_API_QUERY_TYPES.OFFSET]: 0
  },
  initialOption: RHSM_API_QUERY_UOM_TYPES.CORES,
  initialGraphFilters: [
    {
      id: 'cores',
      isOptional: true,
      fill: chartColorBlueLight.value,
      stroke: chartColorBlueDark.value,
      color: chartColorBlueDark.value
    },
    {
      id: 'sockets',
      isOptional: true,
      fill: chartColorBlueLight.value,
      stroke: chartColorBlueDark.value,
      color: chartColorBlueDark.value
    },
    { id: 'thresholdSockets', isOptional: true },
    { id: 'thresholdCores', isOptional: true }
  ],
  initialGuestsFilters: [
    {
      id: 'displayName',
      header: translate('curiosity-inventory.header', { context: 'guestsDisplayName' }),
      cell: (data, session) => {
        const { displayName, inventoryId } = data;
        const { inventory: authorized } = session?.authorized || {};

        if (!inventoryId?.value) {
          return displayName?.value;
        }

        if (!authorized) {
          return displayName?.value || inventoryId?.value;
        }

        return (
          <Button
            isInline
            component="a"
            variant="link"
            target="_blank"
            href={`${helpers.UI_DEPLOY_PATH_PREFIX}/insights/inventory/${inventoryId.value}/`}
          >
            {displayName.value || inventoryId.value}
          </Button>
        );
      }
    },
    {
      id: 'inventoryId',
      cellWidth: 40
    },
    {
      id: 'lastSeen',
      cell: data => (data?.lastSeen?.value && <DateFormat date={data?.lastSeen?.value} />) || '',
      cellWidth: 15
    }
  ],
  initialInventoryFilters: [
    {
      id: 'displayName',
      cell: (data, session) => {
        const { displayName = {}, inventoryId = {}, numberOfGuests = {} } = data;
        const { inventory: authorized } = session?.authorized || {};

        if (!inventoryId.value) {
          return displayName.value;
        }

        let updatedDisplayName = displayName.value || inventoryId.value;

        if (authorized) {
          updatedDisplayName = (
            <Button
              isInline
              component="a"
              variant="link"
              target="_blank"
              href={`${helpers.UI_DEPLOY_PATH_PREFIX}/insights/inventory/${inventoryId.value}/`}
            >
              {displayName.value || inventoryId.value}
            </Button>
          );
        }

        return (
          <React.Fragment>
            {updatedDisplayName}{' '}
            {(numberOfGuests.value &&
              translate('curiosity-inventory.label', { context: 'numberOfGuests', count: numberOfGuests.value }, [
                <PfLabel color="blue" />
              ])) ||
              ''}
          </React.Fragment>
        );
      },
      isSortable: true
    },
    {
      id: 'measurementType',
      cell: data => {
        const { cloudProvider = {}, measurementType = {} } = data;
        return (
          <React.Fragment>
            {translate('curiosity-inventory.measurementType', { context: measurementType.value })}{' '}
            {(cloudProvider.value && (
              <PfLabel color="purple">
                {translate('curiosity-inventory.cloudProvider', { context: cloudProvider.value })}
              </PfLabel>
            )) ||
              ''}
          </React.Fragment>
        );
      },
      isSortable: true,
      cellWidth: 20
    },
    {
      id: 'sockets',
      isOptional: true,
      isSortable: true,
      isWrappable: true,
      cellWidth: 15
    },
    {
      id: 'cores',
      isOptional: true,
      isSortable: true,
      isWrappable: true,
      cellWidth: 15
    },
    {
      id: 'lastSeen',
      cell: data => (data?.lastSeen?.value && <DateFormat date={data?.lastSeen?.value} />) || '',
      isSortable: true,
      isWrappable: true,
      cellWidth: 15
    }
  ],
  initialInventorySettings: {},
  initialSubscriptionsInventoryFilters: [
    {
      id: 'productName',
      isSortable: true
    },
    {
      id: 'serviceLevel',
      isSortable: true,
      isWrappable: true,
      cellWidth: 15
    },
    {
      id: 'upcomingEventDate',
      cell: data =>
        (data?.upcomingEventDate?.value && moment.utc(data?.upcomingEventDate?.value).format('YYYY-DD-MM')) || '',
      isSortable: true,
      isWrappable: true,
      cellWidth: 15
    }
  ],
  initialToolbarFilters: [
    {
      id: RHSM_API_QUERY_TYPES.SLA
    }
  ],
  t: translate,
  viewId: 'viewOpenShift'
};

/**
 * Create a selector from applied state, props.
 *
 * @type {Function}
 */
const makeMapStateToProps = reduxSelectors.view.makeView(OpenshiftView.defaultProps);

const ConnectedOpenshiftView = connect(makeMapStateToProps)(OpenshiftView);

export { ConnectedOpenshiftView as default, ConnectedOpenshiftView, OpenshiftView };
