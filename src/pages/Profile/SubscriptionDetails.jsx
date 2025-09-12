import React from 'react'
import ComponentGuard from '../../components/AccessControl/ComponentGuard';
import { formatDateAsNumber } from '../../utils/extra';

const SubscriptionDetails = (props) => {
    const {roles, subscription, usedContacts} = props;
  return (
    <ComponentGuard allowedRoles={[roles.ADMIN]}>
            <div className="bg-white shadow-lg rounded-lg p-6 w-full">
              <h2 className="text-2xl font-semibold mb-4">
                Subscription Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DetailItem
                  label="Plan Name"
                  value={subscription?.plan?.name || "N/A"}
                />
                <DetailItem label="Contacts Used" value={usedContacts} />

                <DetailItem
                  label="Contact Limit"
                  value={subscription?.contactLimit || 0}
                />
                {/* <DetailItem
                  label="Contact Addons"
                  value={subscription?.contactLimitAddon || 0}
                />
                <DetailItem
                  label="Total Contact Limit"
                  value={totalContactLimit}
                /> */}
                <DetailItem
                  label="Employee Limit"
                  value={subscription?.employeeLimit || 0}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDateAsNumber(subscription?.startDate)}
                />
                <DetailItem
                  label="Plan Expiry Date"
                  value={formatDateAsNumber(subscription?.expiryDate)}
                />
                {/* <DetailItem
                  label="Employee Addons"
                  value={subscription?.employeeLimitAddon || 0}
                />
                <DetailItem
                  label="Total Employee Limit"
                  value={totalEmployeeLimit}
                /> */}

                <DetailItem
                  label="Toggle Limit"
                  value={subscription?.toggleLimit || 0}
                />
              </div>
            </div>
          </ComponentGuard>
  )
}

export default SubscriptionDetails



const DetailItem = ({ label, value }) => (
  <p className="flex justify-between bg-gray-100 p-2 rounded-md">
    <strong>{label}:</strong> <span>{value}</span>
  </p>
);
