import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ArrowRightOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import overviewApi, {
  type DemTheoTrangThai,
  type DongKiemToan,
  type TongQuan,
  type ViecCanLam,
} from "../api/overviewApi";
import { formatTime } from "../components/statusTags";
import { CAM_CANH_BAO, DO_LOI } from "../../../theme/thuongHieu";

const { Text, Title, Paragraph } = Typography;

/**
 * Màn hình điều hành kho dữ liệu.
 *
 * Thứ tự trên màn hình là thứ tự ưu tiên của người vận hành: việc cần làm ngay
 * nằm trên cùng, số liệu quy mô nằm dưới. Một dashboard xếp theo sơ đồ kiến
 * trúc thay vì theo mức khẩn thì đẹp nhưng không ai dùng để trực.
 *
 * Khối nào máy chủ trả `null` là khối người xem không có quyền — ẩn hẳn thay vì
 * hiện 0, để không ai hiểu nhầm rằng hệ đang rỗng.
 */

const MAU_MUC: Record<ViecCanLam["muc"], "error" | "warning" | "info"> = {
  canh_bao: "error",
  cho_xu_ly: "warning",
  luu_y: "info",
};

/** Nhãn tiếng Việt cho các trạng thái hay gặp; thiếu thì hiện nguyên mã. */
const NHAN_TRANG_THAI: Record<string, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã công bố",
  DEPRECATED: "Ngừng dùng",
  ACTIVE: "Đang chạy",
  INACTIVE: "Tạm dừng",
  QUARANTINED: "Cách ly",
  PENDING: "Chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  EXPIRED: "Hết hạn",
  STALE: "Bằng chứng đã cũ",
  RUNNING: "Đang chạy",
  SUCCEEDED: "Thành công",
  FAILED: "Lỗi",
  CANCELLED: "Đã huỷ",
  DEAD: "Vào DLQ",
  UPLOADING: "Đang tải",
  UPLOADED: "Đã tải",
  ACCEPTED: "Đã tiếp nhận",
  PROCESSING: "Đang xử lý",
  PROCESSED: "Đã xử lý",
  ARCHIVED: "Lưu trữ",
  EXPERIMENTAL: "Thử nghiệm",
  RETIRED: "Đã gỡ",
  SUCCESS: "Thành công",
  FAILURE: "Thất bại",
  DENIED: "Bị từ chối",
};

const MAU_TRANG_THAI: Record<string, string> = {
  PUBLISHED: "green",
  APPROVED: "green",
  SUCCEEDED: "green",
  ACCEPTED: "green",
  SUCCESS: "green",
  ACTIVE: "green",
  DRAFT: "default",
  PENDING: "gold",
  RUNNING: "processing",
  PROCESSING: "processing",
  QUARANTINED: "orange",
  FAILED: "orange",
  STALE: "orange",
  EXPERIMENTAL: "orange",
  REJECTED: "red",
  FAILURE: "red",
  DENIED: "red",
  DEAD: "red",
};

function nhan(ma: string): string {
  return NHAN_TRANG_THAI[ma] ?? ma;
}

/** Dải thẻ trạng thái, sắp giảm dần để cái nhiều nhất đọc được trước. */
function ThanhTrangThai({
  theo,
  khi_rong = "Chưa có dữ liệu",
}: {
  theo: DemTheoTrangThai;
  /** Nói rõ *cái gì* chưa có; "chưa có dữ liệu" chung chung dễ bị đọc nhầm
   *  thành cả khối rỗng, trong khi thường chỉ là chưa có lần chạy nào. */
  khi_rong?: string;
}) {
  const cac = Object.entries(theo).sort((a, b) => b[1] - a[1]);
  if (!cac.length)
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {khi_rong}
      </Text>
    );
  return (
    <Space size={[4, 4]} wrap>
      {cac.map(([ma, so]) => (
        <Tag key={ma} color={MAU_TRANG_THAI[ma] ?? "default"}>
          {nhan(ma)}: {so}
        </Tag>
      ))}
    </Space>
  );
}

interface OProps {
  tieu_de: string;
  so: number | string;
  hau_to?: string;
  mo_ta?: string;
  duong_dan?: string;
  theo?: DemTheoTrangThai;
  mau?: string;
}

function ONumber({ tieu_de, so, hau_to, mo_ta, duong_dan, theo, mau }: OProps) {
  const navigate = useNavigate();
  return (
    <Card
      size="small"
      hoverable={Boolean(duong_dan)}
      onClick={duong_dan ? () => navigate(duong_dan) : undefined}
      style={{ height: "100%" }}
    >
      <Statistic
        title={tieu_de}
        value={so}
        suffix={hau_to}
        valueStyle={mau ? { color: mau } : undefined}
      />
      {theo ? (
        <div style={{ marginTop: 8 }}>
          <ThanhTrangThai theo={theo} />
        </div>
      ) : null}
      {mo_ta ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {mo_ta}
        </Text>
      ) : null}
    </Card>
  );
}

interface Props {
  /** Bật khi trang này nằm bên trong một trang khác (ví dụ trang chủ): bỏ đệm
   *  ngoài, và im lặng biến mất nếu người xem không có quyền — trang chủ dành
   *  cho mọi người, không nên ném lỗi vào mặt người vốn không cần khối này. */
  nhung?: boolean;
}

export default function LakehouseDashboardPage({ nhung = false }: Props) {
  const navigate = useNavigate();
  const [dang_tai, setDangTai] = useState(true);
  const [du_lieu, setDuLieu] = useState<TongQuan | null>(null);
  const [khong_du_quyen, setKhongDuQuyen] = useState(false);

  const tai = useCallback(
    async (im_lang = false) => {
      if (!im_lang) setDangTai(true);
      try {
        setDuLieu(await overviewApi.tongQuan());
        setKhongDuQuyen(false);
      } catch (loi) {
        const ma = (loi as { response?: { status?: number } })?.response?.status;
        if (ma === 401 || ma === 403) {
          setKhongDuQuyen(true);
        } else if (!nhung) {
          message.error("Không lấy được số liệu tổng quan");
        }
      } finally {
        setDangTai(false);
      }
    },
    [nhung],
  );

  useEffect(() => {
    tai();
    // Làm mới nền: số liệu vận hành cũ đi rất nhanh, nhưng đừng nháy màn hình.
    const dong_ho = window.setInterval(() => tai(true), 60_000);
    return () => window.clearInterval(dong_ho);
  }, [tai]);

  const cot_kiem_toan = useMemo(
    () => [
      {
        title: "Thời điểm",
        dataIndex: "luc",
        width: 170,
        render: (v: string | null) => (v ? formatTime(v) : "—"),
      },
      { title: "Chủ thể", dataIndex: "chu_the", width: 160 },
      { title: "Hành động", dataIndex: "hanh_dong" },
      {
        title: "Đối tượng",
        dataIndex: "loai_tai_nguyen",
        width: 140,
        render: (v: string | null) => v ?? "—",
      },
      {
        title: "Kết quả",
        dataIndex: "ket_qua",
        width: 120,
        render: (v: string) => (
          <Tag color={MAU_TRANG_THAI[v] ?? "default"}>{nhan(v)}</Tag>
        ),
      },
    ],
    [],
  );

  if (khong_du_quyen) {
    if (nhung) return null;
    return (
      <Alert
        type="info"
        showIcon
        style={{ margin: 24 }}
        message="Bạn chưa có quyền xem số liệu kho dữ liệu"
        description="Cần quyền đọc dữ liệu (data.read). Liên hệ quản trị hệ thống nếu công việc của bạn cần tới."
      />
    );
  }

  if (dang_tai && !du_lieu) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!du_lieu) {
    if (nhung) return null;
    return <Empty description="Chưa có số liệu" style={{ marginTop: 64 }} />;
  }

  const {
    nguon,
    tiep_nhan,
    hang_doi,
    danh_muc,
    chat_luong,
    phe_duyet,
    pipeline,
    mo_hinh,
    phan_phoi,
    kiem_toan,
    viec_can_lam,
    nguoi_dung,
  } = du_lieu;

  return (
    <div style={{ padding: nhung ? 0 : 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Tổng quan kho dữ liệu
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {nguoi_dung.ten} · {nguoi_dung.vai_tro.join(", ") || "chưa gán vai trò"}
            {" · "}
            <Tooltip title="Mọi con số dưới đây chỉ đếm phần bạn được phép đọc, nên chúng không tiết lộ điều gì về dữ liệu ngoài thẩm quyền.">
              <span>
                <SafetyCertificateOutlined /> mức mật {nguoi_dung.clearance_level}
              </span>
            </Tooltip>
          </Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={() => tai()}>
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Việc cần làm nằm trên cùng: đây là lý do người ta mở màn hình này. */}
      {viec_can_lam.length ? (
        <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
          {viec_can_lam.map((v, i) => (
            <Alert
              key={i}
              type={MAU_MUC[v.muc]}
              showIcon
              message={v.noi_dung}
              action={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate(v.duong_dan)}
                >
                  Xử lý <ArrowRightOutlined />
                </Button>
              }
            />
          ))}
        </Space>
      ) : (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message="Không có việc nào đang chờ xử lý"
          description="Không có tệp bị cách ly, không có việc rơi vào hàng đợi thất bại, không có dataset bị chặn công bố."
        />
      )}

      <Row gutter={[12, 12]}>
        {nguon ? (
          <Col xs={24} sm={12} lg={6}>
            <ONumber
              tieu_de="Nguồn dữ liệu"
              so={nguon.tong}
              theo={nguon.theo_trang_thai}
              duong_dan="/lakehouse/sources"
            />
          </Col>
        ) : null}

        {tiep_nhan ? (
          <Col xs={24} sm={12} lg={6}>
            <ONumber
              tieu_de="Đối tượng đã tiếp nhận"
              so={tiep_nhan.tong}
              mo_ta={`${tiep_nhan.trong_24h} tệp mới trong 24 giờ qua`}
              theo={tiep_nhan.theo_trang_thai}
              duong_dan="/lakehouse/ingestion"
            />
          </Col>
        ) : null}

        {danh_muc ? (
          <Col xs={24} sm={12} lg={6}>
            <ONumber
              tieu_de="Dataset trong danh mục"
              so={danh_muc.tong}
              theo={danh_muc.theo_trang_thai}
              duong_dan="/lakehouse/catalog"
            />
          </Col>
        ) : null}

        {hang_doi ? (
          <Col xs={24} sm={12} lg={6}>
            <ONumber
              tieu_de="Việc trong hàng đợi"
              so={hang_doi.tong}
              mo_ta={
                hang_doi.dlq
                  ? `${hang_doi.dlq} việc nằm trong hàng đợi thất bại`
                  : "Hàng đợi thất bại đang rỗng"
              }
              mau={hang_doi.dlq ? DO_LOI : undefined}
              theo={hang_doi.theo_trang_thai}
              duong_dan="/lakehouse/jobs"
            />
          </Col>
        ) : null}
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        {chat_luong ? (
          <Col xs={24} lg={8}>
            <Card
              size="small"
              title="Chất lượng dữ liệu"
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate("/lakehouse/quality")}
                >
                  Chi tiết
                </Button>
              }
              style={{ height: "100%" }}
            >
              {chat_luong.diem_trung_binh === null ? (
                // Chưa đo được thì nói thẳng là chưa đo, đừng vẽ 0 điểm — hai
                // chuyện đó dẫn tới hai hành động khác nhau.
                <Alert
                  type="info"
                  showIcon
                  message="Chưa có lần chạy kiểm tra nào có điểm"
                  description="Rule chỉ cho điểm khi có dòng dữ liệu để đo."
                />
              ) : (
                <Progress
                  percent={chat_luong.diem_trung_binh}
                  status={
                    chat_luong.dataset_dang_bi_chan ? "exception" : "success"
                  }
                  format={(p) => `${p}/100`}
                />
              )}
              <Row gutter={8} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Statistic
                    title="Rule"
                    value={chat_luong.rule}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Issue đang mở"
                    value={chat_luong.issue_dang_mo}
                    valueStyle={{
                      fontSize: 20,
                      color: chat_luong.issue_dang_mo ? CAM_CANH_BAO : undefined,
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Tooltip title="Dataset có rule CRITICAL chưa đạt nên chưa công bố được">
                    <Statistic
                      title="Đang bị chặn"
                      value={chat_luong.dataset_dang_bi_chan}
                      valueStyle={{
                        fontSize: 20,
                        color: chat_luong.dataset_dang_bi_chan
                          ? DO_LOI
                          : undefined,
                      }}
                    />
                  </Tooltip>
                </Col>
              </Row>
            </Card>
          </Col>
        ) : null}

        {phe_duyet ? (
          <Col xs={24} lg={8}>
            <Card
              size="small"
              title="Phê duyệt"
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate("/lakehouse/approvals")}
                >
                  Chi tiết
                </Button>
              }
              style={{ height: "100%" }}
            >
              <Statistic
                title="Chờ bạn quyết định"
                value={phe_duyet.cho_ban_quyet_dinh}
                valueStyle={{
                  color: phe_duyet.cho_ban_quyet_dinh ? CAM_CANH_BAO : undefined,
                }}
              />
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                Không tính yêu cầu do chính bạn tạo: bốn mắt cần hai người khác
                nhau ở hai vế.
              </Paragraph>
              <ThanhTrangThai theo={phe_duyet.theo_trang_thai} />
            </Card>
          </Col>
        ) : null}

        {pipeline || mo_hinh ? (
          <Col xs={24} lg={8}>
            <Card size="small" title="Xử lý & Mô hình" style={{ height: "100%" }}>
              {pipeline ? (
                <>
                  <Statistic
                    title="Pipeline đã khai báo"
                    value={pipeline.tong}
                    valueStyle={{ fontSize: 20 }}
                  />
                  <div style={{ margin: "8px 0 12px" }}>
                    <ThanhTrangThai
                      theo={pipeline.lan_chay_theo_trang_thai}
                      khi_rong="Chưa có lần chạy nào"
                    />
                  </div>
                </>
              ) : null}
              {mo_hinh ? (
                <>
                  <Statistic
                    title="Mô hình đã đăng ký"
                    value={mo_hinh.tong}
                    valueStyle={{ fontSize: 20 }}
                    suffix={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({mo_hinh.noi_bo} nội bộ)
                      </Text>
                    }
                  />
                  <div style={{ marginTop: 8 }}>
                    <ThanhTrangThai theo={mo_hinh.theo_trang_thai} />
                  </div>
                </>
              ) : null}
            </Card>
          </Col>
        ) : null}
      </Row>

      {phan_phoi ? (
        <Card
          size="small"
          title="Đường dữ liệu đi ra"
          style={{ marginTop: 12 }}
        >
          <Row gutter={[12, 12]}>
            {phan_phoi.api_product ? (
              <Col xs={24} sm={8}>
                <ONumber
                  tieu_de="API động"
                  so={phan_phoi.api_product.tong}
                  theo={phan_phoi.api_product.theo_trang_thai}
                  duong_dan="/lakehouse/api-products"
                />
              </Col>
            ) : null}
            {phan_phoi.bi_view ? (
              <Col xs={24} sm={8}>
                <ONumber
                  tieu_de="View BI"
                  so={phan_phoi.bi_view.tong}
                  theo={phan_phoi.bi_view.theo_trang_thai}
                  duong_dan="/lakehouse/bi"
                />
              </Col>
            ) : null}
            {phan_phoi.chi_so ? (
              <Col xs={24} sm={8}>
                <ONumber
                  tieu_de="Chỉ số ngữ nghĩa"
                  so={phan_phoi.chi_so.tong}
                  theo={phan_phoi.chi_so.theo_trang_thai}
                  duong_dan="/lakehouse/metrics"
                />
              </Col>
            ) : null}
          </Row>
        </Card>
      ) : null}

      {kiem_toan ? (
        <Card
          size="small"
          title="Nhật ký kiểm toán"
          style={{ marginTop: 12 }}
          extra={
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {kiem_toan.trong_24h} sự kiện / 24 giờ
                {kiem_toan.bi_tu_choi_24h
                  ? `, ${kiem_toan.bi_tu_choi_24h} bị từ chối`
                  : ""}
              </Text>
              <Button
                type="link"
                size="small"
                onClick={() => navigate("/lakehouse/audit")}
              >
                Xem tất cả
              </Button>
            </Space>
          }
        >
          <Table<DongKiemToan>
            size="small"
            rowKey={(r) => `${r.luc}-${r.hanh_dong}-${r.chu_the}`}
            columns={cot_kiem_toan}
            dataSource={kiem_toan.gan_day}
            pagination={false}
            locale={{ emptyText: "Chưa có sự kiện nào" }}
          />
        </Card>
      ) : null}
    </div>
  );
}
