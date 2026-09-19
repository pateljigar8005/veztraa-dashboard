import { useContext } from "react";
import { Row, Col } from "reactstrap";
import { ThemeColors } from "@src/utility/context/ThemeColors";
import CompanyTable from "./CompanyTable";
import Earnings from "./cards/analytics/Earnings";
import CardMedal from "./cards/advance/CardMedal";
import CardMeetup from "./cards/advance/CardMeetup";
import StatsCard from "./cards/statistics/StatsCard";
import GoalOverview from "./cards/analytics/GoalOverview";
import RevenueReport from "./cards/analytics/RevenueReport";
import OrdersBarChart from "./cards/statistics/OrdersBarChart";
import CardTransactions from "./cards/advance/CardTransactions";
import ProfitLineChart from "./cards/statistics/ProfitLineChart";
import CardBrowserStates from "./cards/advance/CardBrowserState";
import "@styles/react/libs/charts/apex-charts.scss";
import "@styles/base/pages/dashboard-ecommerce.scss";

const EcommerceDashboard = () => {
  const { colors } = useContext(ThemeColors);

  const trackBgColor = "#e9ecef";

  return (
    <div id="dashboard-ecommerce">
      <Row className="match-height">
        <Col xl="4" md="6" xs="12">
          <CardMedal />
        </Col>
        <Col xl="8" md="6" xs="12">
          <StatsCard cols={{ xl: "3", sm: "6" }} />
        </Col>
      </Row>
      <Row className="match-height">
        <Col lg="4" md="12">
          <Row className="match-height">
            <Col lg="6" md="3" xs="6">
              <OrdersBarChart warning={colors.warning.main} />
            </Col>
            <Col lg="6" md="3" xs="6">
              <ProfitLineChart info={colors.info.main} />
            </Col>
            <Col lg="12" md="6" xs="12">
              <Earnings success={colors.success.main} />
            </Col>
          </Row>
        </Col>
        <Col lg="8" md="12">
          <RevenueReport
            primary={colors.primary.main}
            warning={colors.warning.main}
          />
        </Col>
      </Row>
      <Row className="match-height">
        <Col lg="8" xs="12">
          <CompanyTable />
        </Col>
        <Col lg="4" md="6" xs="12">
          <CardMeetup />
        </Col>
        <Col lg="4" md="6" xs="12">
          <CardBrowserStates colors={colors} trackBgColor={trackBgColor} />
        </Col>
        <Col lg="4" md="6" xs="12">
          <GoalOverview success={colors.success.main} />
        </Col>
        <Col lg="4" md="6" xs="12">
          <CardTransactions />
        </Col>
      </Row>
    </div>
  );
};

export default EcommerceDashboard;
