import React from 'react';

const OrderTracker = ({ order, className = '' }) => {
  const stages = [
    {
      key: 'PENDING',
      label: 'Order Placed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      key: 'PREP',
      label: 'In Preparation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'READY',
      label: 'Ready for Pickup',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'PICKED',
      label: 'Picked Up',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H15a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    {
      key: 'ON_ROUTE',
      label: 'On Route',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.key === order?.status) || 0;
  };

  const isStageCompleted = (stageIndex) => {
    return stageIndex <= getCurrentStageIndex();
  };

  const isCurrentStage = (stageIndex) => {
    return stageIndex === getCurrentStageIndex();
  };

  const getStageTime = (stageKey) => {
    if (!order) return null;
    
    const timeMap = {
      'PENDING': order.orderPlacedAt,
      'PREP': order.prepStartedAt,
      'READY': order.readyAt,
      'PICKED': order.pickedAt,
      'ON_ROUTE': order.onRouteAt,
      'DELIVERED': order.deliveredAt
    };

    const time = timeMap[stageKey];
    if (!time) return null;

    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEstimatedTime = () => {
    if (!order?.dispatchTime) return null;
    
    return new Date(order.dispatchTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!order) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No order selected
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order Tracking
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Order #{order.orderId}
          </span>
        </div>
        
        {order.dispatchTime && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Estimated completion: {formatEstimatedTime()}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getCurrentStageIndex() + 1} of {stages.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${((getCurrentStageIndex() + 1) / stages.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const completed = isStageCompleted(index);
          const current = isCurrentStage(index);
          const stageTime = getStageTime(stage.key);

          return (
            <div key={stage.key} className="flex items-start space-x-4">
              {/* Stage Icon */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${completed 
                  ? 'bg-primary-500 border-primary-500 text-white' 
                  : current
                    ? 'bg-primary-100 border-primary-500 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                }
              `}>
                {completed && !current ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stage.icon
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`
                    text-sm font-medium transition-colors duration-300
                    ${completed || current 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {stage.label}
                  </h4>
                  
                  {stageTime && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {stageTime}
                    </span>
                  )}
                </div>

                {/* Stage Status */}
                <div className="mt-1">
                  {completed && !current && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Completed
                    </span>
                  )}
                  {current && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-1.5 animate-pulse"></span>
                      In Progress
                    </span>
                  )}
                  {!completed && !current && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="absolute left-5 mt-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Details */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Customer:</span>
            <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              ₹{order.totalAmount?.toLocaleString('en-IN') || 0}
            </p>
          </div>
          {order.deliveryPartner && (
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400">Delivery Partner:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {order.deliveryPartner.firstName} {order.deliveryPartner.lastName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracker; 