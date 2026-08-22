-- Baseline schema, sinh từ pg_dump của cơ sở dữ liệu do Hibernate tạo ra.
--
-- Đây là mốc khởi đầu của lịch sử migration. Cơ sở dữ liệu đang chạy sẵn được
-- baseline sang phiên bản 1 mà không chạy lại file này (flyway.baseline-on-migrate),
-- còn môi trường mới sẽ dựng schema từ đây.
--
-- Từ phiên bản 2 trở đi, mọi thay đổi lược đồ phải viết thành migration mới;
-- Hibernate chạy ở chế độ validate nên sẽ báo lỗi nếu entity và schema lệch nhau.

CREATE TABLE public.data_entity (
    id character varying(255) NOT NULL,
    description character varying(255),
    font_name character varying(255),
    font_size integer NOT NULL,
    group_advance character varying(255),
    main_table character varying(255),
    password character varying(255),
    report_item_id character varying(255),
    select_advance character varying(255),
    show_index boolean NOT NULL,
    url character varying(255),
    username character varying(255),
    weight_index real NOT NULL
);

CREATE TABLE public.department (
    id character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    description character varying(255),
    name character varying(255),
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.employee (
    id character varying(255) NOT NULL,
    address character varying(255),
    birthday date,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    email character varying(255),
    gender character varying(255),
    key_avatar character varying(255),
    name character varying(255),
    phone character varying(255) NOT NULL,
    "position" character varying(255),
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.employee_department (
    employee_id character varying(255) NOT NULL,
    department_id character varying(255) NOT NULL
);

CREATE TABLE public.field_entity (
    id character varying(255) NOT NULL,
    alias character varying(255),
    alignment integer,
    data_type character varying(255),
    field_key character varying(255),
    group_name character varying(255),
    index integer NOT NULL,
    visible boolean NOT NULL,
    weight real NOT NULL,
    data_id character varying(255)
);

CREATE TABLE public.filter_entity (
    id character varying(255) NOT NULL,
    alias character varying(255),
    default_operator character varying(255),
    default_value character varying(255),
    field_key character varying(255),
    operator_list character varying(255),
    query_value character varying(255),
    value_type character varying(255),
    data_id character varying(255)
);

CREATE TABLE public.group_entity (
    id character varying(255) NOT NULL,
    field_key character varying(255),
    index integer,
    title character varying(255),
    visible boolean,
    data_id character varying(255)
);

CREATE TABLE public.iam_access_review (
    id character varying(255) NOT NULL,
    completed_at timestamp(6) without time zone,
    completed_by character varying(255),
    created_at timestamp(6) without time zone,
    created_by character varying(255) NOT NULL,
    due_at timestamp(6) without time zone,
    name character varying(255) NOT NULL,
    scope_org_code character varying(255),
    status character varying(16) NOT NULL
);

CREATE TABLE public.iam_access_review_item (
    id character varying(255) NOT NULL,
    clearance_level integer,
    decided_at timestamp(6) without time zone,
    decided_by character varying(255),
    decision character varying(16) NOT NULL,
    org_code character varying(255),
    reason text,
    review_id character varying(255) NOT NULL,
    role_code character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    username character varying(255)
);

CREATE TABLE public.iam_auth_audit_event (
    id character varying(255) NOT NULL,
    action character varying(64) NOT NULL,
    actor character varying(128) NOT NULL,
    actor_org character varying(255),
    correlation_id character varying(64),
    details text,
    occurred_at timestamp(6) without time zone,
    policy_decision character varying(64),
    resource_id character varying(128),
    resource_type character varying(64),
    result character varying(16) NOT NULL,
    source_ip character varying(64)
);

CREATE TABLE public.iam_organization (
    id character varying(255) NOT NULL,
    active boolean,
    code character varying(64) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL,
    parent_id character varying(255),
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.iam_permission (
    id character varying(255) NOT NULL,
    category character varying(255),
    code character varying(64) NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL
);

CREATE TABLE public.iam_role (
    id character varying(255) NOT NULL,
    active boolean,
    code character varying(64) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    cross_org boolean,
    description character varying(255),
    max_clearance_level integer,
    name character varying(255) NOT NULL,
    system_role boolean,
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.iam_role_permission (
    role_id character varying(255) NOT NULL,
    permission_id character varying(255) NOT NULL
);

CREATE TABLE public.iam_service_account (
    id character varying(255) NOT NULL,
    active boolean,
    clearance_level integer,
    client_id character varying(128) NOT NULL,
    client_secret_hash character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(255),
    description character varying(255),
    expires_at timestamp(6) without time zone,
    last_used_at timestamp(6) without time zone,
    name character varying(255) NOT NULL,
    org_code character varying(255)
);

CREATE TABLE public.iam_service_account_role (
    service_account_id character varying(255) NOT NULL,
    role_id character varying(255) NOT NULL
);

CREATE TABLE public.iam_user_attribute (
    id character varying(255) NOT NULL,
    expires_at timestamp(6) without time zone,
    granted_at timestamp(6) without time zone,
    granted_by character varying(255),
    attr_key character varying(64) NOT NULL,
    user_id character varying(255) NOT NULL,
    attr_value character varying(255) NOT NULL
);

CREATE TABLE public.iam_user_role (
    user_id character varying(255) NOT NULL,
    role_id character varying(255) NOT NULL
);

CREATE TABLE public.order_entity (
    id character varying(255) NOT NULL,
    field_key character varying(255),
    group_total boolean,
    index integer NOT NULL,
    order_type character varying(255),
    title character varying(255),
    visible boolean NOT NULL,
    data_id character varying(255)
);

CREATE TABLE public.report_category (
    id character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    deleted boolean,
    description character varying(255),
    name character varying(255),
    department_id character varying(255)
);

CREATE TABLE public.report_data_query (
    id character varying(255) NOT NULL,
    approved_at timestamp(6) without time zone,
    approved_by character varying(128),
    code character varying(64) NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(128) NOT NULL,
    description character varying(255),
    max_rows integer,
    name character varying(255) NOT NULL,
    output_columns text,
    security_label_code character varying(64),
    security_level integer,
    statement text NOT NULL,
    status character varying(16) NOT NULL,
    version_no integer NOT NULL
);

CREATE TABLE public.report_definition (
    id character varying(255) NOT NULL,
    active boolean,
    code character varying(64) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    created_by character varying(128) NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL,
    owner_org_code character varying(64),
    owner_user_id character varying(128),
    period_type character varying(16),
    security_label_code character varying(64),
    security_level integer,
    template_format character varying(16),
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.report_entity (
    id character varying(255) NOT NULL,
    margin_bottom real NOT NULL,
    margin_left real NOT NULL,
    margin_right real NOT NULL,
    margin_top real NOT NULL,
    name character varying(255),
    page_type character varying(255)
);

CREATE TABLE public.report_fact (
    id character varying(255) NOT NULL,
    code character varying(32) NOT NULL,
    data_query_code character varying(64),
    data_query_id character varying(36),
    data_query_version integer,
    executed_at timestamp(6) without time zone NOT NULL,
    fact_type character varying(16) NOT NULL,
    label character varying(255),
    placeholder_name character varying(191) NOT NULL,
    raw_value text,
    run_id character varying(255) NOT NULL,
    snapshot_id character varying(36) NOT NULL,
    source_column character varying(128),
    source_row_count integer,
    source_row_index integer,
    unit character varying(255),
    value text
);

CREATE TABLE public.report_item_entity (
    id character varying(255) NOT NULL,
    index integer NOT NULL,
    type character varying(255),
    report_id character varying(255)
);

CREATE TABLE public.report_mapping (
    id character varying(255) NOT NULL,
    ai_fact_codes text,
    ai_instruction text,
    created_at timestamp(6) without time zone,
    created_by character varying(128) NOT NULL,
    data_query_id character varying(255),
    format character varying(32),
    output_column character varying(128),
    placeholder_id character varying(255) NOT NULL,
    row_index integer,
    template_version_id character varying(255) NOT NULL,
    unit character varying(255),
    updated_at timestamp(6) without time zone
);

CREATE TABLE public.report_narrative (
    id character varying(255) NOT NULL,
    blocked boolean,
    edited_at timestamp(6) without time zone,
    edited_by character varying(128),
    fact_codes text,
    final_text text,
    generated_at timestamp(6) without time zone,
    generated_text text,
    model_id character varying(128),
    model_version character varying(64),
    placeholder_name character varying(191) NOT NULL,
    prompt_code character varying(64),
    run_id character varying(255) NOT NULL,
    warnings text
);

CREATE TABLE public.report_placeholder (
    id character varying(255) NOT NULL,
    locator character varying(128),
    name character varying(191) NOT NULL,
    occurrences integer,
    template_version_id character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    type character varying(16) NOT NULL
);

CREATE TABLE public.report_run (
    id character varying(255) NOT NULL,
    ai_model_id character varying(128),
    ai_model_version character varying(64),
    ai_prompt_version character varying(64),
    approved_at timestamp(6) without time zone,
    approved_by character varying(128),
    artifact_file_key character varying(255),
    artifact_sha256 character varying(64),
    created_at timestamp(6) without time zone,
    created_by character varying(128) NOT NULL,
    decision_note text,
    definition_id character varying(255) NOT NULL,
    exported_at timestamp(6) without time zone,
    period_end date,
    period_start date,
    security_label_code character varying(64),
    security_level integer,
    snapshot_at timestamp(6) without time zone,
    snapshot_checksum character varying(64),
    snapshot_id character varying(36) NOT NULL,
    status character varying(24) NOT NULL,
    submitted_at timestamp(6) without time zone,
    submitted_by character varying(128),
    template_version_id character varying(255) NOT NULL,
    title character varying(255),
    warnings text
);

CREATE TABLE public.report_storage (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    description character varying(255),
    file_key character varying(255),
    file_type character varying(255),
    name character varying(255),
    note character varying(255),
    status character varying(255),
    updated_at timestamp(6) without time zone,
    employee_id character varying(255),
    report_category_id character varying(255)
);

CREATE TABLE public.report_template (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    description character varying(255),
    file_key character varying(255),
    file_type character varying(255),
    name character varying(255),
    report_id character varying(255),
    report_type character varying(255),
    updated_at timestamp(6) without time zone,
    employee_id character varying(255),
    report_category_id character varying(255)
);

CREATE TABLE public.report_template_version (
    id character varying(255) NOT NULL,
    approved_at timestamp(6) without time zone,
    approved_by character varying(128),
    change_note text,
    created_at timestamp(6) without time zone,
    created_by character varying(128) NOT NULL,
    definition_id character varying(255) NOT NULL,
    file_key character varying(255) NOT NULL,
    original_name character varying(255),
    retired_at timestamp(6) without time zone,
    sha256 character varying(64),
    size_bytes bigint,
    status character varying(16) NOT NULL,
    version_no integer NOT NULL
);

CREATE TABLE public.sub_entity (
    id character varying(255) NOT NULL,
    join_on character varying(255),
    join_type character varying(255),
    table_name character varying(255),
    data_id character varying(255)
);

CREATE TABLE public.table_entity (
    id character varying(255) NOT NULL,
    report_item_id character varying(255),
    title character varying(255),
    width character varying(255)
);

CREATE TABLE public.table_item_entity (
    id character varying(255) NOT NULL,
    align character varying(255),
    border character varying(255),
    col integer NOT NULL,
    col_span character varying(255),
    font_name character varying(255),
    font_size integer NOT NULL,
    font_style character varying(255)[],
    query_syntax character varying(255),
    "row" integer NOT NULL,
    row_span character varying(255),
    text character varying(255),
    type character varying(255),
    table_id character varying(255)
);

CREATE TABLE public.text_entity (
    id character varying(255) NOT NULL,
    align character varying(255),
    content character varying(255),
    font_name character varying(255),
    font_size integer NOT NULL,
    font_style character varying(255)[],
    report_item_id character varying(255)
);

CREATE TABLE public.user_push (
    id character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    username character varying(255) NOT NULL
);

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    clearance_level integer,
    failed_login_attempts integer,
    last_login_at timestamp(6) without time zone,
    locked_until timestamp(6) without time zone,
    mfa_enabled boolean,
    mfa_enrolled_at timestamp(6) without time zone,
    mfa_secret character varying(64),
    org_code character varying(64),
    password character varying(255) NOT NULL,
    revoked_at timestamp(6) without time zone,
    revoked_by character varying(255),
    role character varying(255),
    status boolean,
    token_version integer,
    username character varying(255) NOT NULL,
    employee_id character varying(255) NOT NULL
);

CREATE TABLE public.ware_approval_config (
    id integer NOT NULL,
    approval_order integer NOT NULL,
    auto_approve boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    is_active boolean NOT NULL,
    updated_at timestamp(6) without time zone,
    approver_id character varying(255) NOT NULL,
    ware_template_id integer NOT NULL
);

ALTER TABLE public.ware_approval_config ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_approval_config_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.ware_batch (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    description character varying(255),
    name character varying(255),
    report_day integer,
    report_month integer,
    report_year integer,
    s3_file_key character varying(255),
    status character varying(255),
    updated_at timestamp(6) without time zone,
    employee_id character varying(255),
    ware_template_id integer,
    CONSTRAINT ware_batch_status_check CHECK (((status)::text = ANY ((ARRAY['Cho_Phe_Duyet'::character varying, 'Da_Phe_Duyet'::character varying, 'Tu_Choi_Phe_Duyet'::character varying])::text[])))
);

CREATE TABLE public.ware_batch_action (
    id integer NOT NULL,
    action character varying(255),
    action_name character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    inserted integer,
    request jsonb,
    response jsonb,
    table_name character varying(255),
    updated integer,
    updated_at timestamp(6) without time zone,
    ware_batch_id integer
);

ALTER TABLE public.ware_batch_action ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_batch_action_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.ware_batch_approval (
    id integer NOT NULL,
    approval_order integer NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    approver_id character varying(255) NOT NULL,
    ware_batch_id integer NOT NULL,
    CONSTRAINT ware_batch_approval_status_check CHECK (((status)::text = ANY ((ARRAY['Cho_Phe_Duyet'::character varying, 'Da_Phe_Duyet'::character varying, 'Tu_Choi_Phe_Duyet'::character varying])::text[])))
);

ALTER TABLE public.ware_batch_approval ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_batch_approval_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE public.ware_batch ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_batch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.ware_category (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    description character varying(255),
    name character varying(255),
    updated_at timestamp(6) without time zone,
    department_id character varying(255)
);

ALTER TABLE public.ware_category ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.ware_data_row (
    id integer NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    data character varying(10000),
    deleted boolean,
    updated_at timestamp(6) without time zone,
    ware_batch_id integer
);

ALTER TABLE public.ware_data_row ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_data_row_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.ware_mapping (
    id integer NOT NULL,
    cell_address character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    field_name character varying(255),
    field_title character varying(255),
    field_type character varying(255),
    field_value character varying(255),
    is_key_column boolean,
    is_scop_filter boolean,
    updated_at timestamp(6) without time zone,
    ware_template_id integer
);

ALTER TABLE public.ware_mapping ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.ware_template (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted boolean,
    description character varying(255),
    excel_file_key character varying(255),
    name character varying(255),
    start_row integer,
    table_code character varying(255),
    table_name character varying(255),
    updated_at timestamp(6) without time zone,
    ware_category_id integer
);

ALTER TABLE public.ware_template ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ware_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.data_entity
    ADD CONSTRAINT data_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.field_entity
    ADD CONSTRAINT field_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.filter_entity
    ADD CONSTRAINT filter_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_entity
    ADD CONSTRAINT group_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_access_review_item
    ADD CONSTRAINT iam_access_review_item_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_access_review
    ADD CONSTRAINT iam_access_review_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_auth_audit_event
    ADD CONSTRAINT iam_auth_audit_event_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_organization
    ADD CONSTRAINT iam_organization_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_permission
    ADD CONSTRAINT iam_permission_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_role_permission
    ADD CONSTRAINT iam_role_permission_pkey PRIMARY KEY (role_id, permission_id);

ALTER TABLE ONLY public.iam_role
    ADD CONSTRAINT iam_role_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_service_account
    ADD CONSTRAINT iam_service_account_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_service_account_role
    ADD CONSTRAINT iam_service_account_role_pkey PRIMARY KEY (service_account_id, role_id);

ALTER TABLE ONLY public.iam_user_attribute
    ADD CONSTRAINT iam_user_attribute_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.iam_user_role
    ADD CONSTRAINT iam_user_role_pkey PRIMARY KEY (user_id, role_id);

ALTER TABLE ONLY public.order_entity
    ADD CONSTRAINT order_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_category
    ADD CONSTRAINT report_category_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_data_query
    ADD CONSTRAINT report_data_query_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_definition
    ADD CONSTRAINT report_definition_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_entity
    ADD CONSTRAINT report_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_fact
    ADD CONSTRAINT report_fact_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_item_entity
    ADD CONSTRAINT report_item_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_mapping
    ADD CONSTRAINT report_mapping_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_narrative
    ADD CONSTRAINT report_narrative_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_placeholder
    ADD CONSTRAINT report_placeholder_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_run
    ADD CONSTRAINT report_run_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_storage
    ADD CONSTRAINT report_storage_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_template
    ADD CONSTRAINT report_template_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.report_template_version
    ADD CONSTRAINT report_template_version_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sub_entity
    ADD CONSTRAINT sub_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.table_entity
    ADD CONSTRAINT table_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.table_item_entity
    ADD CONSTRAINT table_item_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.text_entity
    ADD CONSTRAINT text_entity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_template
    ADD CONSTRAINT uk55rofmegso5lfxtoqd1x0emd3 UNIQUE (code);

ALTER TABLE ONLY public.report_category
    ADD CONSTRAINT ukab85sis7ppmoagky8npx62yso UNIQUE (code);

ALTER TABLE ONLY public.iam_service_account
    ADD CONSTRAINT ukav1q1pxt14xs435u3w76m65qm UNIQUE (client_id);

ALTER TABLE ONLY public.ware_batch
    ADD CONSTRAINT ukbet7m6u16g1ih88kleemwtjcy UNIQUE (code);

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT ukbuf2qp04xpwfp5qq355706h4a UNIQUE (phone);

ALTER TABLE ONLY public.iam_permission
    ADD CONSTRAINT ukc2k4uxuptlb7m1vn3qjlq8hbu UNIQUE (code);

ALTER TABLE ONLY public.ware_category
    ADD CONSTRAINT ukc5qrrhdw7d376c1qxeva1me4e UNIQUE (code);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukd1s31g1a7ilra77m65xmka3ei UNIQUE (employee_id);

ALTER TABLE ONLY public.report_definition
    ADD CONSTRAINT ukj7gh9qltrbxjtfj5b601m4it4 UNIQUE (code);

ALTER TABLE ONLY public.iam_user_attribute
    ADD CONSTRAINT ukjrnh8jmksg3jcffe684420g3v UNIQUE (user_id, attr_key);

ALTER TABLE ONLY public.iam_role
    ADD CONSTRAINT ukm4o214lhvmhh7jmv4fj22yekf UNIQUE (code);

ALTER TABLE ONLY public.iam_organization
    ADD CONSTRAINT ukmst4h39ldi2ccvh78onjiwc52 UNIQUE (code);

ALTER TABLE ONLY public.ware_approval_config
    ADD CONSTRAINT ukojbaiqeg3xl3hq84tuaqi9lok UNIQUE (ware_template_id, approval_order);

ALTER TABLE ONLY public.user_push
    ADD CONSTRAINT ukp77jvsl7vialva05pexdth0b8 UNIQUE (username);

ALTER TABLE ONLY public.department
    ADD CONSTRAINT ukq8ymhgj6pt1msox0o3bg51uvo UNIQUE (code);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukr43af9ap4edm43mmtq01oddj6 UNIQUE (username);

ALTER TABLE ONLY public.report_data_query
    ADD CONSTRAINT uq_report_data_query_version UNIQUE (code, version_no);

ALTER TABLE ONLY public.report_mapping
    ADD CONSTRAINT uq_report_mapping_placeholder UNIQUE (placeholder_id);

ALTER TABLE ONLY public.report_narrative
    ADD CONSTRAINT uq_report_narrative_section UNIQUE (run_id, placeholder_name);

ALTER TABLE ONLY public.report_placeholder
    ADD CONSTRAINT uq_report_placeholder_token UNIQUE (template_version_id, token);

ALTER TABLE ONLY public.report_template_version
    ADD CONSTRAINT uq_report_template_version UNIQUE (definition_id, version_no);

ALTER TABLE ONLY public.user_push
    ADD CONSTRAINT user_push_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_approval_config
    ADD CONSTRAINT ware_approval_config_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_batch_action
    ADD CONSTRAINT ware_batch_action_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_batch_approval
    ADD CONSTRAINT ware_batch_approval_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_batch
    ADD CONSTRAINT ware_batch_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_category
    ADD CONSTRAINT ware_category_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_data_row
    ADD CONSTRAINT ware_data_row_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_mapping
    ADD CONSTRAINT ware_mapping_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ware_template
    ADD CONSTRAINT ware_template_pkey PRIMARY KEY (id);

CREATE INDEX ix_auth_audit_action ON public.iam_auth_audit_event USING btree (action);

CREATE INDEX ix_auth_audit_actor ON public.iam_auth_audit_event USING btree (actor);

CREATE INDEX ix_auth_audit_occurred ON public.iam_auth_audit_event USING btree (occurred_at);

CREATE INDEX ix_report_fact_run ON public.report_fact USING btree (run_id);

CREATE INDEX ix_report_fact_snapshot ON public.report_fact USING btree (snapshot_id);

CREATE INDEX ix_review_item_review ON public.iam_access_review_item USING btree (review_id);

ALTER TABLE ONLY public.ware_batch_approval
    ADD CONSTRAINT fk1c0ts6j3701rno96v6uv9xoj7 FOREIGN KEY (ware_batch_id) REFERENCES public.ware_batch(id);

ALTER TABLE ONLY public.report_template
    ADD CONSTRAINT fk1v2sumdpp6882slf7uqme10u1 FOREIGN KEY (report_category_id) REFERENCES public.report_category(id);

ALTER TABLE ONLY public.iam_user_role
    ADD CONSTRAINT fk1xtvbqcca90w8jduyo16s67l5 FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.report_storage
    ADD CONSTRAINT fk28gwvbdgubb1oes5edagbu57o FOREIGN KEY (report_category_id) REFERENCES public.report_category(id);

ALTER TABLE ONLY public.iam_service_account_role
    ADD CONSTRAINT fk2syp5ea7k1ik8qv8xaabpjjyg FOREIGN KEY (service_account_id) REFERENCES public.iam_service_account(id);

ALTER TABLE ONLY public.iam_service_account_role
    ADD CONSTRAINT fk3833adblahsq5co3wgk7873t4 FOREIGN KEY (role_id) REFERENCES public.iam_role(id);

ALTER TABLE ONLY public.table_item_entity
    ADD CONSTRAINT fk5sa9exj55x2eb39oypslxpbv1 FOREIGN KEY (table_id) REFERENCES public.table_entity(id);

ALTER TABLE ONLY public.ware_approval_config
    ADD CONSTRAINT fk5v8j0r8r1k2lcjwq54rm78fa2 FOREIGN KEY (ware_template_id) REFERENCES public.ware_template(id);

ALTER TABLE ONLY public.iam_role_permission
    ADD CONSTRAINT fk6gft7ylg14n44524x6kfgh29a FOREIGN KEY (role_id) REFERENCES public.iam_role(id);

ALTER TABLE ONLY public.employee_department
    ADD CONSTRAINT fk6njtipgqouu9ax631vmw9xlra FOREIGN KEY (employee_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.ware_data_row
    ADD CONSTRAINT fk7cf13d1a8o9to2s9stpoyrgyt FOREIGN KEY (ware_batch_id) REFERENCES public.ware_batch(id);

ALTER TABLE ONLY public.iam_role_permission
    ADD CONSTRAINT fk7wu2uq2yqke4go3a6bnahacsi FOREIGN KEY (permission_id) REFERENCES public.iam_permission(id);

ALTER TABLE ONLY public.sub_entity
    ADD CONSTRAINT fk8f7xcgv4hwgm5ip1wjnd04v84 FOREIGN KEY (data_id) REFERENCES public.data_entity(id);

ALTER TABLE ONLY public.ware_batch
    ADD CONSTRAINT fk8pqkkdwcvke27g6ei9lrqqm4o FOREIGN KEY (ware_template_id) REFERENCES public.ware_template(id);

ALTER TABLE ONLY public.order_entity
    ADD CONSTRAINT fk9uryb96kk1j3iwdbgah5nj64n FOREIGN KEY (data_id) REFERENCES public.data_entity(id);

ALTER TABLE ONLY public.ware_approval_config
    ADD CONSTRAINT fkc2x1csvt1mpir0stis6tja4pe FOREIGN KEY (approver_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.ware_batch_action
    ADD CONSTRAINT fkd440t9wlw4ywljo9dfd9t8x6n FOREIGN KEY (ware_batch_id) REFERENCES public.ware_batch(id);

ALTER TABLE ONLY public.group_entity
    ADD CONSTRAINT fke2v230v1prh2skdvytxod2q04 FOREIGN KEY (data_id) REFERENCES public.data_entity(id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkfndbe67uw6silwqnlyudtwqmo FOREIGN KEY (employee_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.report_storage
    ADD CONSTRAINT fkgf6fwfwg8t6752ibcrjr56y2j FOREIGN KEY (employee_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.report_template
    ADD CONSTRAINT fkhdetkf0iirb87nn0lpa5fgbmh FOREIGN KEY (employee_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.ware_category
    ADD CONSTRAINT fkhnaoyq5tmpuwowesi7d01aca8 FOREIGN KEY (department_id) REFERENCES public.department(id);

ALTER TABLE ONLY public.ware_batch
    ADD CONSTRAINT fkl37prxd79gqe2ji9iqdo024ng FOREIGN KEY (employee_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.iam_user_role
    ADD CONSTRAINT fkmkf1ycx65mj6a8yc0j6m163t0 FOREIGN KEY (role_id) REFERENCES public.iam_role(id);

ALTER TABLE ONLY public.ware_mapping
    ADD CONSTRAINT fkokm9eg8cua7xp6xkte3qrlme2 FOREIGN KEY (ware_template_id) REFERENCES public.ware_template(id);

ALTER TABLE ONLY public.report_item_entity
    ADD CONSTRAINT fkp925curaqjcvb8hal0m9ick42 FOREIGN KEY (report_id) REFERENCES public.report_entity(id);

ALTER TABLE ONLY public.filter_entity
    ADD CONSTRAINT fksdac0xfocwqo16n0bd78v9rs6 FOREIGN KEY (data_id) REFERENCES public.data_entity(id);

ALTER TABLE ONLY public.employee_department
    ADD CONSTRAINT fksu8j44uxlgh4lg6qwomyeyejl FOREIGN KEY (department_id) REFERENCES public.department(id);

ALTER TABLE ONLY public.ware_batch_approval
    ADD CONSTRAINT fkt4no2db73qpj307smob46jo3i FOREIGN KEY (approver_id) REFERENCES public.employee(id);

ALTER TABLE ONLY public.field_entity
    ADD CONSTRAINT fktetdl0t2w5wfx2mmad9li2yj2 FOREIGN KEY (data_id) REFERENCES public.data_entity(id);

ALTER TABLE ONLY public.ware_template
    ADD CONSTRAINT fktn5p96mahcbyb7suuhtw11ydc FOREIGN KEY (ware_category_id) REFERENCES public.ware_category(id);

ALTER TABLE ONLY public.report_category
    ADD CONSTRAINT fktqnig94sa5h0qadx9lqn06hs9 FOREIGN KEY (department_id) REFERENCES public.department(id);
