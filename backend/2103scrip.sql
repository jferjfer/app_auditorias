--
-- PostgreSQL database dump
--

\restrict 9gQbBUaqM2uHnA0aVBvwffC77ShPK2tw5lV5HIOte6brTl7WTIPT9lopap3EH8m

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-21 17:16:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16494)
-- Name: archivos_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archivos_auditoria (
    id integer NOT NULL,
    auditoria_id integer,
    nombre_archivo character varying(255),
    ruta_archivo text,
    subido_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.archivos_auditoria OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16500)
-- Name: archivos_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.archivos_auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archivos_auditoria_id_seq OWNER TO postgres;

--
-- TOC entry 4952 (class 0 OID 0)
-- Dependencies: 218
-- Name: archivos_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archivos_auditoria_id_seq OWNED BY public.archivos_auditoria.id;


--
-- TOC entry 219 (class 1259 OID 16501)
-- Name: auditorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditorias (
    id integer NOT NULL,
    auditor_id integer,
    ubicacion_destino character varying(100) NOT NULL,
    estado character varying(20) DEFAULT 'en_progreso'::character varying,
    porcentaje_cumplimiento numeric(5,2),
    creada_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT auditorias_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_progreso'::character varying, 'finalizada'::character varying, 'cancelada'::character varying])::text[])))
);


ALTER TABLE public.auditorias OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16507)
-- Name: auditorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditorias_id_seq OWNER TO postgres;

--
-- TOC entry 4953 (class 0 OID 0)
-- Dependencies: 220
-- Name: auditorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditorias_id_seq OWNED BY public.auditorias.id;


--
-- TOC entry 221 (class 1259 OID 16508)
-- Name: informes_generados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.informes_generados (
    id integer NOT NULL,
    analista_id integer,
    filtros_aplicados text,
    ruta_archivo text,
    generado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.informes_generados OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16514)
-- Name: informes_generados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.informes_generados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.informes_generados_id_seq OWNER TO postgres;

--
-- TOC entry 4954 (class 0 OID 0)
-- Dependencies: 222
-- Name: informes_generados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.informes_generados_id_seq OWNED BY public.informes_generados.id;


--
-- TOC entry 223 (class 1259 OID 16515)
-- Name: productos_auditados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos_auditados (
    id integer NOT NULL,
    auditoria_id integer,
    sku character varying(50) NOT NULL,
    nombre_articulo text NOT NULL,
    cantidad_documento integer NOT NULL,
    cantidad_enviada integer NOT NULL,
    cantidad_fisica integer,
    novedad character varying(20),
    observaciones text,
    orden_traslado_original character varying(50),
    registrado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT productos_auditados_novedad_check CHECK (((novedad)::text = ANY (ARRAY[('faltante'::character varying)::text, ('sobrante'::character varying)::text, ('no_salio'::character varying)::text, ('salio_parcial'::character varying)::text, ('averia'::character varying)::text, ('sin_novedad'::character varying)::text])))
);


ALTER TABLE public.productos_auditados OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16522)
-- Name: productos_auditados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_auditados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_auditados_id_seq OWNER TO postgres;

--
-- TOC entry 4955 (class 0 OID 0)
-- Dependencies: 224
-- Name: productos_auditados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_auditados_id_seq OWNED BY public.productos_auditados.id;


--
-- TOC entry 225 (class 1259 OID 16523)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    contrasena_hash text NOT NULL,
    rol character varying(20) NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY (ARRAY[('administrador'::character varying)::text, ('analista'::character varying)::text, ('auditor'::character varying)::text])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16530)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 4956 (class 0 OID 0)
-- Dependencies: 226
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4762 (class 2604 OID 16531)
-- Name: archivos_auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivos_auditoria ALTER COLUMN id SET DEFAULT nextval('public.archivos_auditoria_id_seq'::regclass);


--
-- TOC entry 4764 (class 2604 OID 16532)
-- Name: auditorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditorias ALTER COLUMN id SET DEFAULT nextval('public.auditorias_id_seq'::regclass);


--
-- TOC entry 4767 (class 2604 OID 16533)
-- Name: informes_generados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.informes_generados ALTER COLUMN id SET DEFAULT nextval('public.informes_generados_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 16534)
-- Name: productos_auditados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_auditados ALTER COLUMN id SET DEFAULT nextval('public.productos_auditados_id_seq'::regclass);


--
-- TOC entry 4771 (class 2604 OID 16535)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4937 (class 0 OID 16494)
-- Dependencies: 217
-- Data for Name: archivos_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archivos_auditoria (id, auditoria_id, nombre_archivo, ruta_archivo, subido_en) FROM stdin;
\.


--
-- TOC entry 4939 (class 0 OID 16501)
-- Dependencies: 219
-- Data for Name: auditorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditorias (id, auditor_id, ubicacion_destino, estado, porcentaje_cumplimiento, creada_en) FROM stdin;
1	2	Bodega Central - Inventario Trimestral	finalizada	95.50	2025-09-12 23:23:35.574463
2	2	Centro de Distribución Norte - Auditoría Mensual	en_progreso	65.00	2025-09-15 23:23:35.574463
8	2	Auditoría Múltiple - 2025-09-19 18:56	en_progreso	\N	2025-09-19 23:56:04.027338
9	2	Auditoría Múltiple - 2025-09-20 13:14	en_progreso	\N	2025-09-20 18:14:11.199831
10	2	Auditoría Múltiple - 2025-09-20 13:42	en_progreso	\N	2025-09-20 18:42:13.868855
11	2	Auditoría Múltiple - 2025-09-20 13:42	en_progreso	\N	2025-09-20 18:42:14.072682
12	2	Auditoría Múltiple - 2025-09-20 13:42	en_progreso	\N	2025-09-20 18:42:14.467369
13	2	Auditoría Múltiple - 2025-09-20 13:47	en_progreso	\N	2025-09-20 18:47:31.145574
14	2	Auditoría Múltiple - 2025-09-20 13:47	en_progreso	\N	2025-09-20 18:47:31.356727
15	2	Auditoría Múltiple - 2025-09-20 14:00	en_progreso	\N	2025-09-20 19:00:33.193772
16	2	Auditoría Múltiple - 2025-09-20 14:00	en_progreso	\N	2025-09-20 19:00:33.380863
17	2	Auditoría Múltiple - 2025-09-20 14:00	en_progreso	\N	2025-09-20 19:00:33.731171
18	2	Auditoría Múltiple - 2025-09-20 17:22	en_progreso	\N	2025-09-20 22:22:14.153828
19	2	Auditoría Múltiple - 2025-09-20 17:22	en_progreso	\N	2025-09-20 22:22:14.410925
20	2	Auditoría Múltiple - 2025-09-20 17:22	en_progreso	\N	2025-09-20 22:22:14.779271
21	2	Auditoría Múltiple - 2025-09-20 17:25	en_progreso	\N	2025-09-20 22:25:52.828283
22	2	Auditoría Múltiple - 2025-09-20 17:25	en_progreso	\N	2025-09-20 22:25:53.132819
23	2	Auditoría Múltiple - 2025-09-20 17:25	en_progreso	\N	2025-09-20 22:25:53.615222
24	2	Auditoría Múltiple - 2025-09-20 17:27	en_progreso	\N	2025-09-20 22:27:23.527858
40	2	Auditoría Múltiple - 2025-09-20 18:30	finalizada	1.03	2025-09-20 23:30:30.298297
39	2	Auditoría Múltiple - 2025-09-20 18:25	finalizada	0.00	2025-09-20 23:25:17.767168
38	2	Auditoría Múltiple - 2025-09-20 18:25	finalizada	0.00	2025-09-20 23:25:17.395747
37	2	Auditoría Múltiple - 2025-09-20 17:45	finalizada	0.00	2025-09-20 22:45:29.015332
36	2	Auditoría Múltiple - 2025-09-20 17:45	finalizada	0.00	2025-09-20 22:45:28.772436
35	2	Auditoría Múltiple - 2025-09-20 17:45	finalizada	0.00	2025-09-20 22:45:28.566661
32	2	Auditoría Múltiple - 2025-09-20 17:44	finalizada	0.00	2025-09-20 22:44:23.707171
34	2	Auditoría Múltiple - 2025-09-20 17:44	finalizada	0.00	2025-09-20 22:44:24.394804
33	2	Auditoría Múltiple - 2025-09-20 17:44	finalizada	0.00	2025-09-20 22:44:24.140278
41	2	Auditoría Múltiple - 2025-09-20 19:11	finalizada	0.00	2025-09-21 00:11:41.621627
31	2	Auditoría Múltiple - 2025-09-20 17:37	finalizada	1.03	2025-09-20 22:37:32.59962
30	2	Auditoría Múltiple - 2025-09-20 17:37	finalizada	0.00	2025-09-20 22:37:32.342553
29	2	Auditoría Múltiple - 2025-09-20 17:37	finalizada	0.00	2025-09-20 22:37:32.127908
28	2	Auditoría Múltiple - 2025-09-20 17:37	finalizada	0.00	2025-09-20 22:37:31.837559
27	2	Auditoría Múltiple - 2025-09-20 17:37	finalizada	0.00	2025-09-20 22:37:13.398959
26	2	Auditoría Múltiple - 2025-09-20 17:37	finalizada	0.00	2025-09-20 22:37:13.087528
25	2	Auditoría Múltiple - 2025-09-20 17:27	finalizada	0.00	2025-09-20 22:27:23.882075
42	2	Auditoría Múltiple - 2025-09-20 20:44	finalizada	1.03	2025-09-21 01:44:00.50197
43	3	Auditoría Múltiple - 2025-09-20 21:01	finalizada	0.00	2025-09-21 02:01:40.079181
44	3	Auditoría Múltiple - 2025-09-20 21:03	en_progreso	\N	2025-09-21 02:03:50.212423
45	2	Auditoría Múltiple - 2025-09-20 21:43	en_progreso	\N	2025-09-21 02:43:47.323428
46	2	Auditoría Múltiple - 2025-09-21 00:15	en_progreso	\N	2025-09-21 05:15:19.893595
47	2	Auditoría OT VE24559 - 2025-09-21	en_progreso	\N	2025-09-21 20:42:47.371284
48	2	Auditoría Múltiple (2 OTs) - 2025-09-21 15:45	en_progreso	\N	2025-09-21 20:45:03.987786
49	2	Auditoría Múltiple (VE24681, VE24559) - 2025-09-21 15:52	en_progreso	\N	2025-09-21 20:52:37.316598
50	2	Auditoría OT VE24681 - 2025-09-21	en_progreso	\N	2025-09-21 20:53:15.34813
\.


--
-- TOC entry 4941 (class 0 OID 16508)
-- Dependencies: 221
-- Data for Name: informes_generados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.informes_generados (id, analista_id, filtros_aplicados, ruta_archivo, generado_en) FROM stdin;
\.


--
-- TOC entry 4943 (class 0 OID 16515)
-- Dependencies: 223
-- Data for Name: productos_auditados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos_auditados (id, auditoria_id, sku, nombre_articulo, cantidad_documento, cantidad_enviada, cantidad_fisica, novedad, observaciones, orden_traslado_original, registrado_en) FROM stdin;
1	21	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
2	21	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
3	21	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
4	21	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
5	21	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
6	21	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
7	21	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
8	21	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
9	21	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
10	21	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
11	21	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
12	21	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
13	21	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
14	21	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
15	21	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
16	21	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
17	21	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
18	21	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
19	21	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
20	21	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
21	21	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
22	21	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
23	21	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
24	21	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
25	21	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
26	21	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
27	21	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
28	21	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
29	21	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
30	21	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
31	21	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
32	21	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
33	21	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
34	21	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
35	21	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
36	21	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
37	21	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
38	21	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
39	21	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
40	21	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
41	21	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
42	21	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
43	21	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
44	21	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
45	21	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
46	21	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
47	21	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
48	21	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
49	21	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
50	21	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
51	21	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
52	21	7896588951987	Max - Cat Castrados - 1 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
53	21	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
54	21	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
55	21	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
56	21	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
57	21	7703889073136	Cutamycon Crema - 100 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
58	21	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
59	21	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
60	21	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
61	21	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
62	21	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
63	21	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
64	21	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
65	21	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
66	21	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
67	21	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
68	21	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
69	21	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
70	21	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
71	21	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
72	21	7707205154516	Agility Gold - Gatos - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
73	21	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
74	21	7707205154509	Agility Gold - Gatos - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
75	21	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
76	21	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
77	21	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
78	21	7898349703231	Monello Raza Pequeña - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
79	21	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
80	21	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
81	21	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
82	21	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
83	21	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
84	21	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
85	21	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
86	21	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
87	21	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
88	21	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
89	21	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
90	21	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
91	21	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
92	21	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
93	21	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
94	21	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
95	21	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
96	21	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
97	21	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:52.869575
98	22	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
99	22	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
100	22	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
101	22	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
102	22	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
103	22	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
104	22	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
105	22	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
106	22	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
107	22	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
108	22	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
109	22	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
110	22	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
111	22	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
112	22	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
113	22	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
114	22	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
115	22	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
116	22	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
117	22	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
118	22	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
119	22	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
120	22	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
121	22	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
122	22	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
123	22	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
124	22	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
125	22	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
126	22	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
127	22	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
128	22	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
129	22	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
130	22	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
131	22	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
132	22	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
133	22	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
134	22	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
135	22	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
136	22	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
137	22	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
138	22	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
139	22	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
140	22	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
141	22	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
142	22	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
143	22	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
144	22	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
145	22	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
146	22	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
147	22	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
148	22	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
149	22	7896588951987	Max - Cat Castrados - 1 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
150	22	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
151	22	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
152	22	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
153	22	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
154	22	7703889073136	Cutamycon Crema - 100 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
155	22	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
156	22	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
157	22	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
158	22	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
159	22	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
160	22	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
161	22	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
162	22	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
163	22	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
164	22	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
165	22	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
166	22	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
167	22	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
168	22	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
169	22	7707205154516	Agility Gold - Gatos - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
170	22	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
171	22	7707205154509	Agility Gold - Gatos - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
172	22	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
173	22	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
174	22	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
175	22	7898349703231	Monello Raza Pequeña - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
176	22	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
177	22	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
178	22	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
179	22	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
180	22	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
181	22	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
182	22	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
183	22	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
184	22	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
185	22	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
186	22	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
187	22	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
188	22	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
189	22	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
190	22	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
191	22	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
192	22	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
193	22	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
194	22	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.271393
1363	35	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1362	35	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1361	35	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1365	35	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1366	35	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1364	35	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1367	35	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1368	35	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1369	35	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1370	35	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1372	35	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1371	35	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1373	35	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1374	35	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1375	35	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1377	35	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1376	35	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1378	35	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1379	35	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1380	35	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
195	23	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
196	23	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
197	23	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
198	23	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
199	23	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
200	23	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
201	23	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
202	23	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
203	23	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
204	23	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
205	23	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
206	23	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
207	23	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
208	23	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
209	23	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
210	23	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
211	23	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
212	23	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
213	23	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
214	23	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
215	23	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
216	23	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
217	23	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
218	23	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
219	23	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
220	23	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
221	23	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
222	23	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
223	23	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
224	23	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
225	23	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
226	23	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
227	23	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
228	23	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
229	23	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
230	23	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
231	23	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
232	23	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
233	23	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
234	23	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
235	23	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
236	23	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
237	23	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
238	23	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
239	23	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
240	23	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
241	23	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
242	23	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
243	23	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
244	23	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
245	23	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
246	23	7896588951987	Max - Cat Castrados - 1 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
247	23	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
248	23	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
249	23	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
250	23	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
251	23	7703889073136	Cutamycon Crema - 100 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
252	23	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
253	23	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
254	23	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
255	23	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
256	23	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
257	23	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
258	23	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
259	23	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
260	23	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
261	23	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
262	23	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
263	23	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
264	23	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
265	23	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
266	23	7707205154516	Agility Gold - Gatos - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
267	23	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
268	23	7707205154509	Agility Gold - Gatos - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
269	23	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
270	23	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
271	23	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
272	23	7898349703231	Monello Raza Pequeña - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
273	23	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
274	23	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
275	23	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
276	23	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
277	23	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
278	23	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
279	23	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
280	23	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
281	23	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
282	23	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
283	23	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
284	23	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
285	23	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
286	23	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
287	23	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
288	23	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
289	23	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
290	23	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
291	23	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:25:53.653523
292	24	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
293	24	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
294	24	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
295	24	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
296	24	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
297	24	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
298	24	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
299	24	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
300	24	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
301	24	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
302	24	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
303	24	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
304	24	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
305	24	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
306	24	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
307	24	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
308	24	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
309	24	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
310	24	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
311	24	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
312	24	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
313	24	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
314	24	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
315	24	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
316	24	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
317	24	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
318	24	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
319	24	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
320	24	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
321	24	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
322	24	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
323	24	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
324	24	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
325	24	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
326	24	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
327	24	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
328	24	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
329	24	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
330	24	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
331	24	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
332	24	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
333	24	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
334	24	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
335	24	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
336	24	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
337	24	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
338	24	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
339	24	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
340	24	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
341	24	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
342	24	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
343	24	7896588951987	Max - Cat Castrados - 1 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
344	24	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
345	24	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
346	24	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
347	24	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
348	24	7703889073136	Cutamycon Crema - 100 GR	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
349	24	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
350	24	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
351	24	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
352	24	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
353	24	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
354	24	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
355	24	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
356	24	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
357	24	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
358	24	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
359	24	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
360	24	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
361	24	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
362	24	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
363	24	7707205154516	Agility Gold - Gatos - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
364	24	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
365	24	7707205154509	Agility Gold - Gatos - 3 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
366	24	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
367	24	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
368	24	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
369	24	7898349703231	Monello Raza Pequeña - 7 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
370	24	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
371	24	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
372	24	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
373	24	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
374	24	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
375	24	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
376	24	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
377	24	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
378	24	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
379	24	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
380	24	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
381	24	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
382	24	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
383	24	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
384	24	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
385	24	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
386	24	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
387	24	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
388	24	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-20 22:27:23.559461
395	25	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
393	25	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
399	25	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
397	25	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
396	25	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
398	25	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
391	25	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
392	25	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
402	25	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
394	25	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
403	25	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
401	25	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
400	25	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
404	25	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
405	25	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
406	25	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
408	25	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
407	25	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
409	25	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
410	25	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
413	25	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
411	25	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
414	25	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
417	25	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
421	25	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
418	25	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
419	25	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
420	25	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
416	25	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
424	25	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
422	25	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
426	25	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
423	25	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
428	25	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
429	25	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
427	25	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
430	25	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
432	25	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
433	25	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
434	25	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
435	25	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
437	25	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
431	25	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
438	25	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
441	25	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
439	25	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
440	25	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
442	25	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
443	25	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
447	25	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
444	25	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
446	25	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
445	25	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
448	25	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
449	25	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
454	25	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
451	25	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
452	25	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
453	25	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
456	25	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
455	25	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
519	26	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
457	25	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
458	25	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
459	25	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
460	25	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
461	25	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
462	25	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
463	25	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
464	25	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
487	26	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
488	26	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
490	26	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
491	26	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
493	26	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
492	26	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
494	26	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
495	26	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
496	26	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
498	26	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
497	26	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
500	26	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
499	26	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
502	26	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
501	26	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
503	26	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
504	26	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
505	26	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
506	26	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
507	26	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
508	26	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
509	26	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
510	26	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
513	26	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
517	26	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
518	26	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
516	26	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
514	26	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
466	25	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
465	25	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
470	25	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
469	25	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
467	25	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
471	25	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
472	25	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
473	25	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
475	25	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
474	25	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
476	25	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
480	25	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
478	25	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
479	25	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
477	25	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
468	25	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
481	25	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
483	25	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
482	25	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
485	25	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
484	25	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
523	26	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
524	26	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
525	26	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
526	26	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
527	26	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
531	26	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
528	26	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
530	26	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
529	26	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
532	26	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
533	26	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
535	26	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
534	26	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
538	26	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
536	26	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
543	26	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
540	26	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
542	26	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
541	26	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
544	26	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
539	26	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
545	26	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
546	26	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
547	26	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
548	26	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
549	26	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
551	26	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
552	26	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
553	26	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
550	26	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
555	26	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
559	26	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
557	26	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
558	26	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
560	26	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
562	26	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
561	26	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
564	26	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
554	26	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
565	26	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
563	26	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
566	26	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
567	26	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
570	26	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
569	26	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
568	26	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
571	26	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
572	26	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
574	26	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
573	26	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
587	27	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
590	27	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
591	27	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
589	27	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
586	27	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
585	27	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
592	27	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
593	27	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
594	27	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
595	27	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
588	27	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
596	27	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
597	27	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
599	27	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
598	27	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
600	27	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
601	27	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
602	27	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
603	27	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
604	27	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
605	27	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
606	27	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
609	27	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
608	27	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
611	27	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
615	27	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
613	27	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
614	27	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
612	27	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
610	27	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
618	27	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
616	27	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
620	27	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
619	27	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
624	27	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
621	27	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
622	27	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
623	27	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
625	27	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
627	27	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
628	27	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
626	27	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
576	26	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
575	26	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
579	26	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
578	26	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
580	26	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
582	26	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
779	29	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
778	29	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
629	27	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
633	27	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
636	27	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
632	27	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
635	27	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
634	27	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
639	27	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
637	27	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
638	27	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
640	27	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
641	27	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
643	27	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
647	27	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
644	27	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
650	27	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
648	27	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
651	27	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
652	27	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
649	27	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
642	27	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
656	27	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
658	27	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
655	27	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
653	27	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
654	27	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
661	27	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
659	27	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
660	27	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
662	27	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
663	27	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
657	27	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
664	27	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
668	27	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
667	27	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
665	27	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
666	27	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
675	27	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
672	27	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
669	27	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
670	27	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
673	27	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
676	27	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
677	27	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
678	27	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
674	27	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
679	27	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
671	27	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
681	28	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
685	28	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
684	28	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
682	28	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
683	28	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
687	28	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
686	28	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
688	28	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
690	28	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
691	28	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
692	28	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
693	28	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
695	28	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
694	28	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
696	28	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
697	28	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
698	28	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
699	28	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
700	28	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
701	28	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
702	28	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
703	28	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
704	28	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
705	28	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
706	28	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
707	28	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
708	28	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
709	28	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
711	28	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
710	28	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
713	28	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
717	28	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
714	28	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
718	28	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
721	28	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
712	28	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
720	28	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
722	28	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
723	28	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
727	28	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
725	28	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
726	28	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
724	28	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
728	28	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
729	28	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
732	28	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
733	28	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
730	28	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
731	28	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
875	30	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
877	30	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
878	30	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
876	30	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
880	30	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
879	30	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
881	30	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
882	30	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
883	30	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
884	30	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
734	28	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
739	28	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
742	28	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
740	28	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
741	28	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
744	28	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
743	28	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
748	28	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
746	28	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
750	28	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
747	28	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
749	28	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
745	28	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
754	28	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
753	28	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
751	28	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
755	28	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
756	28	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
759	28	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
761	28	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
757	28	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
758	28	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
760	28	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
762	28	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
752	28	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
764	28	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
763	28	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
766	28	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
765	28	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
768	28	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
767	28	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
770	28	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
769	28	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
771	28	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
774	28	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
773	28	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
775	28	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
776	28	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
772	28	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
781	29	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
782	29	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
783	29	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
785	29	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
786	29	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
787	29	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
788	29	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
789	29	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
790	29	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
791	29	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
792	29	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
793	29	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
794	29	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
795	29	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
796	29	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
797	29	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
798	29	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
799	29	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
800	29	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
801	29	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
802	29	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
804	29	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
806	29	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
808	29	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
807	29	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
810	29	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
809	29	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
811	29	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
815	29	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
814	29	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
812	29	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
816	29	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
805	29	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
821	29	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
819	29	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
818	29	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
820	29	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
817	29	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
827	29	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
823	29	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
825	29	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
826	29	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
824	29	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
831	29	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
832	29	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
829	29	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
828	29	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
834	29	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
833	29	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
1382	35	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1383	35	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1384	35	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1386	35	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1385	35	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1387	35	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1390	35	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1388	35	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1391	35	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1392	35	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1393	35	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1394	35	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1389	35	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1395	35	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
835	29	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
837	29	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
840	29	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
839	29	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
841	29	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
842	29	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
838	29	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
844	29	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
848	29	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
846	29	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
847	29	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
849	29	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
851	29	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
850	29	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
854	29	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
853	29	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
855	29	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
856	29	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
857	29	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
859	29	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
858	29	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
852	29	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
860	29	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
862	29	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
864	29	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
863	29	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
861	29	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
865	29	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
868	29	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
866	29	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
867	29	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
871	29	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
873	29	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
872	29	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
886	30	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
887	30	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
888	30	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
889	30	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
891	30	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
892	30	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
893	30	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
895	30	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
894	30	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
896	30	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
897	30	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
898	30	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
899	30	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
900	30	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
901	30	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
904	30	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
903	30	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
906	30	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
910	30	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
909	30	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
907	30	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
908	30	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
911	30	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
905	30	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
912	30	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
914	30	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
913	30	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
915	30	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
917	30	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
918	30	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
920	30	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
919	30	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
921	30	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
922	30	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
923	30	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
924	30	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
925	30	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
926	30	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
927	30	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
928	30	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
930	30	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
929	30	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
931	30	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
933	30	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
932	30	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
938	30	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
934	30	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
935	30	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
937	30	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
972	31	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
977	31	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
973	31	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
974	31	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
975	31	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
982	31	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	2	sin_novedad		VE24559	2025-09-20 22:37:32.635803
978	31	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
979	31	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
981	31	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
944	30	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
984	31	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
983	31	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
985	31	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
986	31	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
987	31	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
989	31	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
990	31	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
988	31	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
991	31	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
992	31	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
976	31	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	4	sin_novedad		VE24559	2025-09-20 22:37:32.635803
939	30	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
942	30	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
940	30	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
945	30	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
949	30	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
946	30	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
947	30	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
948	30	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
950	30	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
954	30	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
953	30	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
952	30	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
951	30	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
959	30	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
957	30	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
956	30	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
960	30	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
955	30	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
962	30	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
963	30	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
965	30	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
961	30	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
964	30	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
967	30	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
968	30	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
969	30	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
966	30	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
970	30	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
993	31	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
995	31	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
996	31	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
997	31	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1000	31	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1002	31	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
999	31	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1004	31	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1005	31	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1009	31	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1001	31	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1012	31	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1008	31	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1011	31	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1010	31	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1013	31	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1015	31	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1018	31	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1016	31	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1014	31	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1017	31	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1023	31	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1021	31	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1019	31	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1025	31	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1020	31	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1024	31	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1027	31	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1029	31	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1028	31	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1030	31	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1031	31	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1032	31	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1034	31	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1022	31	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1033	31	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1035	31	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1038	31	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1039	31	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1037	31	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1036	31	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1042	31	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1045	31	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1044	31	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1043	31	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1041	31	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1040	31	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1046	31	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1073	32	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1075	32	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1068	32	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1076	32	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1069	32	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1072	32	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1070	32	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1078	32	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1074	32	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1079	32	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1080	32	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1081	32	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1082	32	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1083	32	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1084	32	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1086	32	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1085	32	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1087	32	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1088	32	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1089	32	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1090	32	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1091	32	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1092	32	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1093	32	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1097	32	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1099	32	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1100	32	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1098	32	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1049	31	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1047	31	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1048	31	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1050	31	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1052	31	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1055	31	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1056	31	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1053	31	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1054	31	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1057	31	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1051	31	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1058	31	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1061	31	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1060	31	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1059	31	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1065	31	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1062	31	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1067	31	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1064	31	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1063	31	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1066	31	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1103	32	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1107	32	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1105	32	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1106	32	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1114	32	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1112	32	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1111	32	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1113	32	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1110	32	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1117	32	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1116	32	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1120	32	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1118	32	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1119	32	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1121	32	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1123	32	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1124	32	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1115	32	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1125	32	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1126	32	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1130	32	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1127	32	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1129	32	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1128	32	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1132	32	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1134	32	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1133	32	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1136	32	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1135	32	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1131	32	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1137	32	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1140	32	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1139	32	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1141	32	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1138	32	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1142	32	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1144	32	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1145	32	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1147	32	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1143	32	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1151	32	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1152	32	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1148	32	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1150	32	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1149	32	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1146	32	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1153	32	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1156	32	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1154	32	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1155	32	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1158	32	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1160	32	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1159	32	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1161	32	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1162	32	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1164	32	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1165	33	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1167	33	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1173	33	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1170	33	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1166	33	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1172	33	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1174	33	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1175	33	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1171	33	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1177	33	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1176	33	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1169	33	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1178	33	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1179	33	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1180	33	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1181	33	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1182	33	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1183	33	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1184	33	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1185	33	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1186	33	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1187	33	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1188	33	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1189	33	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1190	33	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1192	33	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1191	33	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1193	33	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1194	33	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1195	33	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1197	33	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1200	33	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1199	33	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1201	33	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1203	33	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1202	33	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1206	33	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1196	33	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1207	33	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1209	33	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1210	33	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1208	33	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1263	34	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1264	34	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1211	33	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1212	33	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1215	33	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1217	33	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1220	33	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1221	33	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1222	33	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1223	33	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1219	33	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1216	33	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1225	33	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1227	33	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1226	33	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1224	33	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1228	33	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1229	33	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1233	33	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1230	33	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1235	33	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1231	33	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1236	33	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1237	33	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1238	33	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1239	33	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1240	33	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1241	33	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1247	33	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1243	33	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1242	33	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1244	33	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1246	33	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1248	33	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1249	33	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1253	33	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1251	33	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1250	33	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1252	33	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1245	33	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1258	33	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1257	33	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1256	33	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1254	33	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1255	33	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1259	33	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1260	33	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1261	33	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1267	34	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1266	34	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1268	34	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1270	34	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1271	34	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1272	34	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1274	34	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1275	34	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1276	34	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1277	34	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1278	34	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1279	34	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1280	34	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1281	34	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1282	34	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1283	34	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1284	34	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1285	34	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1286	34	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1287	34	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1288	34	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1289	34	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1290	34	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1291	34	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1293	34	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1297	34	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1295	34	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1296	34	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1294	34	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1300	34	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1299	34	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1298	34	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1292	34	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1304	34	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1307	34	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1306	34	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1303	34	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1305	34	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1312	34	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1311	34	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1309	34	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1310	34	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1313	34	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1314	34	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1315	34	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1318	34	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1317	34	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1316	34	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1308	34	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1319	34	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1397	35	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1398	35	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1399	35	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1400	35	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1401	35	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1402	35	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1404	35	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1405	35	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1406	35	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1407	35	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1408	35	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1409	35	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1410	35	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1321	34	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1322	34	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1320	34	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1323	34	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1326	34	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1329	34	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1328	34	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1325	34	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1332	34	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1330	34	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1333	34	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1335	34	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1334	34	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1337	34	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1338	34	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1336	34	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1331	34	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1340	34	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1339	34	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1342	34	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1343	34	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1345	34	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1341	34	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1344	34	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1347	34	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1349	34	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1348	34	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1350	34	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1351	34	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1358	34	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1353	34	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1354	34	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1356	34	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1355	34	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1357	34	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1352	34	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1458	36	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1463	36	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1457	36	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1462	36	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1459	36	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1461	36	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1464	36	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1460	36	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1411	35	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1412	35	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1414	35	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1416	35	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1417	35	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1419	35	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1421	35	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1420	35	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1418	35	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1423	35	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1424	35	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1425	35	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1428	35	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1426	35	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1429	35	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1431	35	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1433	35	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1435	35	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1430	35	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1432	35	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1436	35	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1427	35	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1434	35	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1437	35	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1439	35	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1438	35	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1442	35	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1445	35	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1443	35	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1444	35	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1441	35	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1440	35	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1446	35	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1451	35	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1447	35	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1449	35	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1448	35	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1452	35	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1453	35	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1455	35	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1454	35	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1469	36	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1467	36	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1468	36	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1470	36	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1471	36	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1473	36	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1472	36	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1474	36	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1475	36	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1476	36	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1477	36	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1478	36	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1482	36	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1479	36	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1481	36	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1480	36	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1484	36	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1483	36	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1485	36	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1486	36	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1487	36	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1488	36	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1489	36	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1491	36	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1493	36	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1492	36	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1495	36	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1496	36	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1497	36	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1490	36	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1498	36	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1499	36	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1501	36	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1503	36	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1505	36	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1502	36	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1504	36	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1506	36	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1507	36	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1509	36	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1510	36	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1508	36	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1512	36	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1511	36	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1513	36	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1516	36	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1514	36	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1517	36	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1518	36	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1515	36	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1520	36	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1522	36	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1521	36	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1519	36	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1523	36	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1524	36	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1527	36	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1526	36	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1525	36	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1529	36	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1530	36	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1534	36	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1532	36	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1531	36	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1533	36	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1535	36	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1536	36	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1528	36	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1539	36	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1538	36	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1537	36	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1540	36	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1546	36	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1541	36	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1542	36	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1543	36	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1544	36	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1549	36	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1551	36	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1548	36	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1550	36	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1547	36	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1545	36	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1552	36	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1557	37	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1555	37	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1556	37	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1558	37	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1560	37	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1559	37	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1562	37	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1561	37	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1563	37	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1564	37	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1565	37	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1566	37	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1567	37	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1568	37	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1569	37	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1570	37	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1571	37	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1572	37	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1573	37	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1574	37	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1575	37	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1576	37	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1577	37	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1578	37	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1579	37	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1581	37	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1582	37	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1583	37	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1584	37	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1585	37	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1588	37	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1587	37	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1586	37	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1589	37	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1580	37	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1593	37	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1591	37	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1595	37	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1594	37	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1590	37	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1597	37	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1596	37	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1601	37	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1600	37	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1603	37	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1602	37	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1606	37	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1605	37	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1604	37	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1598	37	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1651	38	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1652	38	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1655	38	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1654	38	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1656	38	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1657	38	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1660	38	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1658	38	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1659	38	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1607	37	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1608	37	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1612	37	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1609	37	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1611	37	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1614	37	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1613	37	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1616	37	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1615	37	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1618	37	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1621	37	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1620	37	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1626	37	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1627	37	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1617	37	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1624	37	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1623	37	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1625	37	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1629	37	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1630	37	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1628	37	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1631	37	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1632	37	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1635	37	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1634	37	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1636	37	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1638	37	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1637	37	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1633	37	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1640	37	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1639	37	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1642	37	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1641	37	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1644	37	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1646	37	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1643	37	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1647	37	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1645	37	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1648	37	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1649	37	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1663	38	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1664	38	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1667	38	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1665	38	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1666	38	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1668	38	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1669	38	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1670	38	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1671	38	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1672	38	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1673	38	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1674	38	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1677	38	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1678	38	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1676	38	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1680	38	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1681	38	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1683	38	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1686	38	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1685	38	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1687	38	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1689	38	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1688	38	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1692	38	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1690	38	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1691	38	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1693	38	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1697	38	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1695	38	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1696	38	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1698	38	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1699	38	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1679	38	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1703	38	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1702	38	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1704	38	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1700	38	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1701	38	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1705	38	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1706	38	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1711	38	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1710	38	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1708	38	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1707	38	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1709	38	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1714	38	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1712	38	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1713	38	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1748	39	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1749	39	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1751	39	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1752	39	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1754	39	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1753	39	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1755	39	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1756	39	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1757	39	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1758	39	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1759	39	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1760	39	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1761	39	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1762	39	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1763	39	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1764	39	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1765	39	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1766	39	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1767	39	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1768	39	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1715	38	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1717	38	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1719	38	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1723	38	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1720	38	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1718	38	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1725	38	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1724	38	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1721	38	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1728	38	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1726	38	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1732	38	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1730	38	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1729	38	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1731	38	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1734	38	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1733	38	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1736	38	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1735	38	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1742	38	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1744	38	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1741	38	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1737	38	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1739	38	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1745	38	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1746	38	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1743	38	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1740	38	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1769	39	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1772	39	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1771	39	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1773	39	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1774	39	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1779	39	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1776	39	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1775	39	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1780	39	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1781	39	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1783	39	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1782	39	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1785	39	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1789	39	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1787	39	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1786	39	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1788	39	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1778	39	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1790	39	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1792	39	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1793	39	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1794	39	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1791	39	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1795	39	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1797	39	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1799	39	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1800	39	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1796	39	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1798	39	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1806	39	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1802	39	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1805	39	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1809	39	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1808	39	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1801	39	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1807	39	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1810	39	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1811	39	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1817	39	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1812	39	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1813	39	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1815	39	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1816	39	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1820	39	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1819	39	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1822	39	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1818	39	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1821	39	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1814	39	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1849	40	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1850	40	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1852	40	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1844	40	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1845	40	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1853	40	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1854	40	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1855	40	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1847	40	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1851	40	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1857	40	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1858	40	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1859	40	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1861	40	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1860	40	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1862	40	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1863	40	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1864	40	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1865	40	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1866	40	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1867	40	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1868	40	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1869	40	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1870	40	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1871	40	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1872	40	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1873	40	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1874	40	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1875	40	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1876	40	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1823	39	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1824	39	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1827	39	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1830	39	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1828	39	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1829	39	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1831	39	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1832	39	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1833	39	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1834	39	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1836	39	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1835	39	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1838	39	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1840	39	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1839	39	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1841	39	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1837	39	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1842	39	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1843	39	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1878	40	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1879	40	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1880	40	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1881	40	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1882	40	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1884	40	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1885	40	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1886	40	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1887	40	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1888	40	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1889	40	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1890	40	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1891	40	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1893	40	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1894	40	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1895	40	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1896	40	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1897	40	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1898	40	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1899	40	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1900	40	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1902	40	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1903	40	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1904	40	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1905	40	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1908	40	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1906	40	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1907	40	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1909	40	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1910	40	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1914	40	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1913	40	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1912	40	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1918	40	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1916	40	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1917	40	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1922	40	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1921	40	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1923	40	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1915	40	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1925	40	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1924	40	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1926	40	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1927	40	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1920	40	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1919	40	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1928	40	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1929	40	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1930	40	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1931	40	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1932	40	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1892	40	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	7	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1877	40	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1846	40	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1848	40	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1856	40	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1883	40	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1901	40	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1911	40	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1933	40	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1935	40	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1934	40	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1936	40	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1937	40	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1939	40	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1938	40	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1940	40	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:30:30.333561
1747	39	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1750	39	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1770	39	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1777	39	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1784	39	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1804	39	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1803	39	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1825	39	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1826	39	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-20 23:25:17.810854
1650	38	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1653	38	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1662	38	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1661	38	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1675	38	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1684	38	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1682	38	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1694	38	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 23:25:17.535312
1716	38	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1722	38	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1727	38	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1738	38	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-20 23:25:17.537394
1553	37	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1554	37	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1592	37	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1599	37	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1610	37	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1622	37	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
1619	37	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:45:29.144775
390	25	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
389	25	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
412	25	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
415	25	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
425	25	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
436	25	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
450	25	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-20 22:27:23.939681
1456	36	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1465	36	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1466	36	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1494	36	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1500	36	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.805622
1359	35	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1360	35	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1381	35	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1396	35	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1403	35	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1415	35	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1413	35	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1422	35	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1450	35	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:45:28.581559
1101	32	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1071	32	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1077	32	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1096	32	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1094	32	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1095	32	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1104	32	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1102	32	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1108	32	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1109	32	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1122	32	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1157	32	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1163	32	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:44:23.74574
1262	34	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1265	34	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1269	34	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1273	34	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1301	34	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1302	34	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1324	34	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1327	34	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1346	34	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.428732
1168	33	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1198	33	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1204	33	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1205	33	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1213	33	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1214	33	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1218	33	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1234	33	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
1232	33	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:44:24.16192
971	31	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
980	31	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
994	31	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
998	31	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1007	31	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1006	31	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1003	31	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1026	31	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.635803
1943	41	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1942	41	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1949	41	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1944	41	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1950	41	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1946	41	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1945	41	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1952	41	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1948	41	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1953	41	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1954	41	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1955	41	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1956	41	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1957	41	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1958	41	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1959	41	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1960	41	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1963	41	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1965	41	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1966	41	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1968	41	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1967	41	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1969	41	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1970	41	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1964	41	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1971	41	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1973	41	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1978	41	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1974	41	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1975	41	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1977	41	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1976	41	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1982	41	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1981	41	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1984	41	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1979	41	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1985	41	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1986	41	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1989	41	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1987	41	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1988	41	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1990	41	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1991	41	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1995	41	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1994	41	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1993	41	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1996	41	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1992	41	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1997	41	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1998	41	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1941	41	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1947	41	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1951	41	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1961	41	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1962	41	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1972	41	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1980	41	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1983	41	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2001	41	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
1999	41	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2000	41	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2004	41	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2003	41	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2005	41	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2007	41	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2006	41	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2002	41	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2009	41	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2010	41	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2008	41	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2011	41	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2012	41	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2013	41	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2015	41	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2014	41	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2016	41	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2017	41	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2018	41	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2021	41	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2019	41	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2023	41	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2022	41	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2020	41	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2029	41	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2026	41	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2028	41	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2025	41	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2027	41	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2031	41	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2030	41	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2035	41	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2033	41	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2024	41	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2032	41	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2036	41	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2034	41	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
2037	41	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-21 00:11:41.670127
874	30	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
885	30	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
890	30	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
902	30	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
916	30	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
936	30	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
943	30	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
941	30	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
958	30	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:32.376455
777	29	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
780	29	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
784	29	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
803	29	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
813	29	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
830	29	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
822	29	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
836	29	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
843	29	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
845	29	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
869	29	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
870	29	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:32.152003
680	28	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
689	28	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
716	28	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
715	28	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
719	28	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
737	28	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
738	28	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
735	28	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
736	28	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:31.883706
583	27	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
584	27	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
607	27	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
617	27	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
630	27	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
631	27	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
645	27	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
646	27	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.435382
486	26	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
489	26	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
511	26	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
512	26	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
515	26	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
521	26	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
522	26	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
520	26	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
537	26	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
556	26	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
581	26	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
577	26	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-20 22:37:13.201749
2042	42	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2044	42	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2045	42	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2046	42	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2040	42	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2041	42	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2043	42	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2047	42	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2048	42	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2049	42	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2050	42	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2051	42	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2053	42	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2054	42	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2056	42	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2057	42	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2058	42	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2059	42	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2060	42	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2061	42	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2062	42	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2063	42	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2064	42	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2065	42	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2066	42	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2067	42	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2068	42	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2069	42	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2070	42	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2071	42	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2074	42	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2072	42	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2075	42	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2077	42	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2076	42	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2080	42	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2079	42	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2083	42	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2081	42	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2082	42	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2073	42	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2078	42	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2084	42	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2087	42	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2085	42	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2086	42	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2091	42	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2088	42	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2092	42	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2089	42	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2097	42	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2094	42	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2096	42	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2095	42	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2098	42	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2099	42	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2100	42	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2101	42	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2103	42	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2102	42	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2093	42	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2055	42	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	8	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2038	42	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2039	42	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2052	42	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2090	42	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2106	42	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2108	42	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2105	42	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2104	42	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2107	42	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2111	42	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2110	42	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2109	42	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2113	42	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2112	42	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2114	42	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2115	42	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2116	42	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2117	42	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2119	42	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2122	42	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2123	42	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2124	42	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2120	42	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2121	42	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2129	42	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2125	42	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2127	42	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2126	42	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2128	42	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2130	42	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2132	42	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2133	42	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2134	42	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2131	42	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2118	42	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-21 01:44:00.551572
2135	43	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2136	43	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2137	43	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2139	43	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2140	43	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2141	43	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2138	43	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	3	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2143	43	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2144	43	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2145	43	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2146	43	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2147	43	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2148	43	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2149	43	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2150	43	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2151	43	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2451	48	7707214570239	Bismopet - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2153	43	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2154	43	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2156	43	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2155	43	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2157	43	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2158	43	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2159	43	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2162	43	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2160	43	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2163	43	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2165	43	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2168	43	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2167	43	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2166	43	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2169	43	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2170	43	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2174	43	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2171	43	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2173	43	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2164	43	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2175	43	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2180	43	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2177	43	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2176	43	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2178	43	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2179	43	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2181	43	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2185	43	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2183	43	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2184	43	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2182	43	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2189	43	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2190	43	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2187	43	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2191	43	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2192	43	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2194	43	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2195	43	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2193	43	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2186	43	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2152	43	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	8	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2452	48	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2453	48	7709447496751	BR FOR CAT -  Snack Hairball Control Bola de Pelos - 350 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2142	43	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2161	43	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2172	43	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2188	43	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2196	43	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2197	43	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2198	43	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2200	43	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2199	43	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2201	43	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2203	43	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2204	43	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2207	43	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2206	43	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2205	43	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2202	43	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2211	43	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2208	43	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2212	43	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2209	43	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2210	43	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2217	43	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2213	43	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2214	43	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2215	43	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2218	43	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2221	43	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2222	43	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2220	43	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2219	43	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2223	43	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2225	43	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2226	43	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2224	43	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2216	43	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2227	43	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2228	43	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2229	43	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2230	43	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2231	43	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-21 02:01:40.118635
2234	44	7708388303654	Dog's Natural Care - Bálsamo Curativo - 21 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2235	44	073657008590	Evolve - Cat Kitten Chicken & Rice Pollo - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2233	44	052742712307	Hill'S Sd - Kitten Alimento Saludable Para Gatitos Sabor Pollo - 3 LB	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2236	44	7709572799246	Pixie - Hueso Natural - 200 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2237	44	7707865302456	Belly Treats - Barquillo - 6 uds	4	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2240	44	7707205158415	Chunky - Pollo Adultos - 9 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2238	44	850030015211	Churu - Inaba Cat Tuna Recipe With Crab Flavor - 56 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2241	44	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2244	44	030111451422	Royal Canin - Yorkshire Terrier Adult - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2242	44	7703220044481	Argos - Cama Económica ExtraGrande (70x55x19cm) - Azul	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2243	44	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2246	44	7707865302791	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 30 Rollos - 600 bolsas	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2247	44	850030015228	Churu - Inaba Cat Tuna Recipe With Shrimp Flavor - 56 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2248	44	7709727443925	Br For Cat - Gatitos Cachorros - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2249	44	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	8	8	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2250	44	164100000708	4 Moments - Colchón Gris/Azul 110x95x14 cm - L	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2252	44	7707205150259	Agility Gold - Pequeños Cachorros - 8 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2253	44	030111451958	Royal Canin - Dachshund Puppy - 1.14 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2254	44	7709651115448	Foresta - Aglomerante Sostenible - 10 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2255	44	7709423190734	Siu - Esencia Floral Paz Y Calma - 20 MILILITRO	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2256	44	606110140799	Wow Cat - Salmón Pollo Ternera Cocinado sin Refrigeración - 100 GR	12	12	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2257	44	736372712981	Funkies  - Galletas Naturales para Perro Sabor  Manzana y Mango - 125 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2258	44	606110136310	Wow Can - Alimento Carne De Res Al Vapor sin Refrigeración - 300 GR	9	9	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2259	44	7709355546425	MAÍZ CAT - Arena de Maíz Para Gato - 4 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2260	44	7709666658350	Royal Canin - Tripack Alimento Húmedo  Adult Instinctive - 255 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2261	44	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2262	44	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	17	17	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2263	44	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	15	15	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2265	44	855958006556	Churu - Inaba Cat Atún - 4 uds	30	30	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2267	44	7707308880664	Pet Spa - Rascador Divan - ÚNICA	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2268	44	073657008644	Evolve - Cat Classic Salmon Adulto - 1.24 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2266	44	030111561565	Royal Canin - Renal Support S Dog - 2.72 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2269	44	8009470014656	Monge - VetSolution Recovery Feline - 100 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2264	44	050000290680	Félix - Paté Pavo Y Menudencias - 156  GR	14	14	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2271	44	052742195308	Hill'S Pd Metabolic - Alimento Perro Mantenimiento Peso Sabor Pollo - 27.5 LB	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2270	44	7707205154813	Agility Gold - Snacks Dental - 150g	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2273	44	850006715411	Churu - Inaba Dog Snack 4 Piezas Chicken With Salmon - 56 GR	15	15	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2274	44	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2276	44	4014355220781	Dr. Clauders - Trainee Snack - Cordero	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2277	44	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	5	5	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2275	44	857848093608	Max - Professional Line Adulto Performance Pollo & Arroz - 2 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2284	44	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2283	44	7896588951987	Max - Cat Castrados - 1 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2282	44	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2281	44	892383002005	Smartbones Pollo Mini X 8 Unidades - 0 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2278	44	052742204703	Hill'S Sd- Light Alimento Saludable Gato Adulto Sabor Pollo - 7 LB	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2286	44	7708694229624	Bonnat - Veterinary Diet Feline Gastrointestinal - 2 KG	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2287	44	3182550711142	Royal Canin Veterinary Renal Feline - 2 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2290	44	7707308880411	Salsa Natural Select Carne - 375 MILILITRO	9	9	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2288	44	7703889073136	Cutamycon Crema - 100 GR	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2289	44	8055960258260	My Family Placa Hueso Grande Aluminio Gris Basic - 35 GR	6	6	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2292	44	852978008508	Fruitables Snack Para Gato Salmon Y Arandanos - 70 GR	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2294	44	857848093585	Max - Professional Line Performance Adultos Razas Pequeñas Pollo & Arroz - 8 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2291	44	030111604484	Royal Canin - Adult Instinctive - 85  GR	22	22	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2295	44	7898349703125	Monello Tradicional Adulto - 15 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2293	44	850030015464	Churu - Inaba Cat Snack Churu Caja Variedad Atún 280 g - 20 Uds	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2297	44	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2298	44	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	22	22	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2296	44	736372712998	Funkies  - Galletas Naturales para Perro Sabor Remolacha, Pollo y Zanahoria - 125 GR	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2232	44	7708694229907	Bonnat - Grain Free Canine Puppy Medium/Large Breeds - 2 KG	4	4	4	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2239	44	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	8	8	8	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2245	44	7708304363748	Basic Farm - Basic Probiotics Recuperacion Intestinal Caja x 30 sobres - 127 GR	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2251	44	4913993146005	Codillos De Res Three Pets - 190 GR	5	5	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2272	44	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2280	44	7708228519825	Let's Be Fresh - Pañitos Húmedos para Mascotas - 50 UND	7	7	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2279	44	076484136078	Coastal Pet - Perro Bozal Basket - Talla 3	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2285	44	7707336722042	Heel - Traumeel Antiinflamatorio Natural Para Mascotas - 50  MEDICAMENTOS	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2299	44	701575381456	Wow Can - Alimento Baja en Proteína Al Vapor sin Refrigeración - 300 GR	8	8	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2300	44	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	9	9	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2301	44	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2302	44	7709399777458	Br For Cat - Adulto Castrados - 1 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2305	44	7707205154509	Agility Gold - Gatos - 3 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2303	44	7707205154516	Agility Gold - Gatos - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2304	44	030111460431	Royal Canin VHN - Hepático Perro - 3.5 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2306	44	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	8	8	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2310	44	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2308	44	073657390657	Evolve - Cat Pouche Grain Free Salmon Y Patatas Dulces - 85 GR	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2307	44	164100000786	4 Moments - Arnés Lona Camuflado Rosa - XL	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2311	44	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2309	44	7898349703231	Monello Raza Pequeña - 7 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2316	44	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2313	44	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2314	44	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2317	44	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2315	44	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2312	44	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2320	44	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2319	44	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2322	44	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2321	44	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2318	44	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2323	44	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2325	44	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2324	44	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2327	44	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2328	44	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2326	44	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	0	sin_novedad		VE24559	2025-09-21 02:03:50.241722
2329	45	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2330	45	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2331	45	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2332	45	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2333	45	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2334	45	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2335	45	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2336	45	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2337	45	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2338	45	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2339	45	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2340	45	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2341	45	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2342	45	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2343	45	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2344	45	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2345	45	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2346	45	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-21 02:43:47.382718
2347	45	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	22	sin_novedad		VE24559	2025-09-21 02:43:47.382718
2365	46	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	0	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2386	48	052742660059	Hills - Science Diet Kitten Savory Chicken Entrée - 5,5 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2351	46	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	4	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2366	46	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	22	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2348	46	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	3	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2356	46	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	2	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2364	46	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	1	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2354	46	7896588951994	Max - Cat Castrados - 3 KG	2	2	0	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2387	48	7707115301703	Compañía California - Metrodix 8% - 60 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2388	48	38100179029	Pro Plan Veterinary Diets - NF Kidney Function Advanced Care Feline - 156 GR	15	15	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2363	46	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	7	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2350	46	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	1	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2362	46	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	24	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2361	46	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	5	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2352	46	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	4	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2389	48	7707772810334	Natural Freshly - Ambientador Antiestres Biopronnabis CBD - 240 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2390	48	815260005258	Go! - Carnivore Grain-Free Chicken Turkey+Duck Cat - 1.4 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2391	48	706460000641	Whiskas - Alimento Húmedo Gatos Salmon - 85  GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2359	46	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	6	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2353	46	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	4	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2392	48	7700184000300	Probiodog - Caja - 10 SOBRES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2360	46	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	8	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2349	46	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	7	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2367	47	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2368	47	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2369	47	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2370	47	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2371	47	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2372	47	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2373	47	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2374	47	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2375	47	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2376	47	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2358	46	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	8	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2377	47	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2378	47	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2357	46	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	20	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2379	47	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2380	47	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2355	46	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	1	sin_novedad		VE24559	2025-09-21 05:15:19.908437
2393	48	052742338903	Hill'S Pd - I/D Alimento Húmedo Perro Cuidado Digestivo Sabor Pollo - 12,5 OZ	30	30	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2394	48	7708388303210	Dog's Natural Care -  Jabón Origen Spa Herbal - 110 gr	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2381	47	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2382	47	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2383	47	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2384	47	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2385	47	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-21 20:42:47.406136
2395	48	7702195205903	Bussie - Stomizol 20 mg Caja - 10 Tab	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2396	48	7797453971843	Pedigree - Dentastix Snack Perro Adulto - 7 BARRAS	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2397	48	PD400000142	Paw Day - Juguete Interactivo Taches - MORADO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2398	48	7708574195209	Tommy - Pouch Gato Adulto Trozos de Salmón Y Bacalao en Salsa - 100 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2399	48	7896588951963	Max - Cat Gatito Pollo - 1 KG	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2400	48	810833020003	Smartbones Sweet Potato Mini - 8 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2401	48	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2402	48	7702521276874	Dog Chow - Alimento Húmedo Para Perros Precio Especial Pack x5 - 500 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2403	48	7613039947630	Pro Plan - Estirilizados con OptiRenal - 1 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2404	48	7703681042590	Galletas Quínoa Energy Razas Grandes - 250 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2405	48	3182550711159	Royal Canin - Urinary So Cat - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2406	48	4007221055457	Baytril - Tabletas 50 - 10  MEDICAMENTOS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2407	48	7708786723962	Esencias Gabrica - Esencias Florales De Agresividad - SPRAY 250 ml MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2408	48	7707205159146	Agility Gold - Premios - 250 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2409	48	7707205154974	Chunky - Pollo Gatos - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2410	48	030111604408	Royal Canin - Kitten Instinctive - 85 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2411	48	7703090368403	Nutriss - Perros Adult Salsa Carne - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2412	48	855958006556	Churu - Inaba Cat Atún - 4 uds	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2413	48	7707205153144	Chunky Deli Caprichos Tocineta Snack - 160 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2414	48	7707308880312	Petlabs - Clorexy Pet Oral - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2415	48	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2416	48	7707205153052	Dog Yurt - Chunky Delidog Snack para Perros - 160 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2417	48	7709141799677	Feliway - Friends Recarga. - 48 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2418	48	7702084057132	Donkat - Gatitos - 1 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2419	48	7501072209801	Félix Classic Con Atún - 85 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2420	48	7709548759885	Dowolf - Galletas Mixtas Pollo y Ternera - 200 GR	6	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2421	48	7708228519214	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 1.5 KG	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2422	48	052742296807	Hill'S Sd - Perfect Weight Alimento Gato Peso Perfecto Sabor Pollo - 3 LB	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2423	48	857276007697	Churu - Inaba Cat Snack Churu Bombonera Variedad De Pollo y Atún 700 g - 50 Uds	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2424	48	030111471574	Royal Canin - Alimento Húmedo Spayed Neutered - 85 GR	39	39	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2425	48	706460000689	Whiskas - Alimento Húmedo Gatos Res - 85  GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2426	48	7708574195377	Tommy - Pouch Perro Adulto Trozos de Res con Verduras Salsa - 100 GR	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2427	48	7798042365906	Holliday - Cardial B 2.5 mg - 20 comprimidos	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2428	48	7707205150860	Pote Chunky Delicat Pollo - 156 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2429	48	7709141799615	Feliway - Multicat Difusor + Recarga. - 48 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2430	48	3182550743228	Royal Canin - Shih Tzu Adulto - 1.5 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2431	48	3182550707305	Royal Canin - Mother y Babycat - 400 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2432	48	7708574195087	Tommy - Pouch Perro Adulto Trozos de Pollo con Verduras Salsa - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2433	48	7706358000879	Lindopel - Suplemento Perros y Gatos - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2434	48	7707772810730	Natural Freshly - Bucocare Enjuague Bucal Menta - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2435	48	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2436	48	3182550702157	Royal Canin - Regular Fit - 400 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2437	48	7898604436706	N&D - Tropical Selection Fel Castrado Frango - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2438	48	052742014531	Hill'S Pd - Metabolic Treats Premios Saludables Para Perro Sabor Pollo - 340 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2439	48	7709214028833	Animal Lovers Sándwich Bone Mix - 350 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2440	48	7501072209788	FELIX CLASSIC con Carne - 85 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2441	48	7501072214560	Pro Plan - Alimento húmeto para gatitos - 85 GR	13	13	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2442	48	8470000107511	Vecol - Asbrip Pets. - 150 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2443	48	PD400000075	Paw Day - Peluche Araña - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2444	48	164100000219	Paw Day – Combo Pelotas Tipo Tenis Interactivas para Snacks - 3 UNIDADES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2445	48	38100179005	Pro Plan  Veterinary - Diets NF Enfermedad Renal Etapa Inicial - 1.4 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2446	48	7707205153465	Chunky - Pouch Delidog Trozos De Pavo Adulto - 250 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2447	48	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2448	48	7898019868055	Ourofino - Petcell - 50 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2449	48	7707865309332	Belly Treats - Huesos 3 - 4 - 3 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2450	48	7703381243488	NexGard Spectra - Tableta Masticable para Perros 3.6 - 7.5 KG - 3.6 - 7.5 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2454	48	030111435538	Royal Cain - Appetite Control Wet - 85 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2455	48	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	13	13	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2456	48	7898604433262	N&D - Prime Feline Frango Adult Castrado - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2457	48	052742700809	Hill'S Pd- I/D Cuidado Digestivo Alimento Húmedo Perro Sabor Pavo - 13 OZ	35	35	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2458	48	7709189726635	Feliway - Classic Recarga. - 48 MILILITRO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2459	48	7707308880671	Pet Spa - Tapete Tradicional - 14 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2460	48	4913993142311	Bombonera Rollitos De Res Three Pets - 250 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2461	48	7708786723498	Esencias Gabrica - Esencias Florales De Estrés - GOTERO 30 ml MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2462	48	PD400000103	Paw Day - Combo Duo Pelotas Luz Gato - GATO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2463	48	7708388303463	Dog's Natural Care - Bálsamo Humectante - 21 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2464	48	7709129857924	MICHIKO - Alimento Húmedo Cremoso - 4 Sachets	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2465	48	030111472533	Royal Canin - Renal Support E Dog Wet - 385 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2466	48	073657009306	Evolve - Dog Bandeja Classic Crafted Meals Salmon - 99 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2467	48	7898053580883	Vetnil - Glicopan - 125 ML MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2468	48	6942133300814	Calcium Milk Bone - 12 UNIDADES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2469	48	030111470713	Royal Canin VHN - Gastro Intestinal Low Fat Lata - 385 GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2470	48	7707772810723	Natural Freshly - Derma Clean Limpiador Lagrimal - 120 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2471	48	030111442956	Royal Canin VHN - Urinary Gato Lata - 145 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2472	48	7707232090979	Natural Freshly - Vita Crunch Urovital - 50 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2473	48	7703889125705	Cutamycon Loción - 50 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2474	48	7708574195599	Br For Cat - Lata Wild Ocean Fish - 400 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2475	48	7707205159122	Italcol  - Menú Natural Cremoso Gato Surtido Bolsa x 6 Unidades - 78 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2476	48	7898053599502	Organew - Suplemento. - 100 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2477	48	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2478	48	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2479	48	7707205154240	Agility Gold - Pouch Trozos De Pavo Adulto - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2480	48	7707308882156	Natural Select - Galleta Parrillada - 1000 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2481	48	38100136350	Pro Plan Veterinary Diets - EN Dietas Gastroenteric Feline - 156 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2482	48	7708228519818	Besties - Huesos Masticables Mini Sabor Mantequilla de Mani - 9 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2483	48	7896588944538	Equilibrio - F Gatos Adulto - 1,5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2484	48	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2485	48	7707865302456	Belly Treats - Barquillo - 6 uds	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2486	48	7707205155438	Agility Gold - Prescripción Enterico Soporte Gastrointestinal Lata - 360 GR	23	23	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2487	48	4014355624725	Dr Clauders - Cat Intestinal - 200 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2488	48	7702521772475	Fancy Feast - Alimento Húmedo Petits Filets Pague 4 Lleve 5 Sobres - 425 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2489	48	7707232097947	Natural Freshly - Glucosamina + Condroitina x Caja - 15 Sobres	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2490	48	7707308880008	Pet Spa - Cepillo Deslanador Gatos - Único	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2491	48	7707232094731	Natural Freshly - Digestar Fibra x Caja - 12 Sobres	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2492	48	7707205151539	Chunky Delicat Salmón - 156 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2493	48	7891000332344	One - Multiproteínas Perros Cachorros Y Adultos  Carne, Pollo Y Cordero - 85 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2494	48	7896588944521	Equilibrio - F Gato Filhote - 1,5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2495	48	7898604433231	N&D - Prime Feline Frango Adult - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2496	48	4913993141659	Trocitos Mix Three Pets - 120 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2497	48	7702487033016	CanAmor - Talco Desodorante - 100 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2498	48	7707319650027	Mypet - Hueso Cerdo - Unidad	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2499	48	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2500	48	8445290179630	Fancy Feast - Purée Kiss Con Atún y Salmón en Salsa Cremosa - 40 gr	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2501	48	7708808596659	Tommy Pets - Pañitos Humedos - 100 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2502	48	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2503	48	7707232090863	Natural Freshly - Mieltertos Suspensión - 180 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2504	48	7707007406912	Pets Kingdom  - Puloff x 1,34 ml  11- 20 kg - 1,34 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2505	48	4007221055402	Advocate - Pipeta Solución Tópica Gatos Hasta 8 Kg - 0.8 MILILITRO	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2506	48	7798042360246	Total Full LC - Perros De 20 Hasta 60 Kg - 3 Tabletas	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2507	48	052742339009	Hill'S Pd - I/D Alimento Húmedo Perro Cuidado Digestivo Sabor Pollo - 5,5 OZ	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2508	48	7709049265786	BR FOR CAT -  Snack Play Catnip - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2509	48	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2510	48	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2511	48	7707205154530	Agility Gold - Pouch Trozos De Cordero Adulto - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2512	48	29534752157	Galletas De Cordero Y Arroz Laika By Rausch - 150 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2513	48	050000290482	Félix - Paté Salmón - 156  GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2514	48	736990005168	Shed X - Suplemento Perros. - 16 OZ	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2515	48	7709990740271	Artri-Tabs - Tabletas Saborizadas. - 45 MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2516	48	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2517	48	PD400000001	Paw Day - Peluche Galleta de Jengibre - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2518	48	7707903300147	Natural Select - Salsa Natural Select Gatos Sabor a Pollo - 220 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2519	48	7707321675131	PETMED-Hidratante - 60 MILILITRO	4	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2520	48	7707308881746	Pet Spa - Tapete Con Carbon Activo - 14 Und	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2521	48	0781159484933	Reeld´s - Medical Pet Tgi Tripack - 825 GR	27	27	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2522	48	7707903300338	Natural Select - Salsa Natural Select Gatos Sabor a Carne - 220 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2523	48	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2524	48	7707007405663	Pets Kingdom  - Fortipet Frasco - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2525	48	7708808596895	Tommy - Snack Cats Skin And Coat - 75 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2526	48	7707232090917	Natural Freshly - Vita Crunch Flex Artrit - 50 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2527	48	035585131474	Kong - Hueso Con Cuerda Cachorros. - XS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2528	48	7708574195230	Br For Cat - Lata Wild Salmon - 400 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2529	48	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2530	48	7708388303579	Dog's Natural Care - Bálsamo Curativo - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2531	48	3182550784566	Royal Canin - Sterilised 7+ - 1.5 KG	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2533	48	7702578829023	Mirrapel - Oleoso. - 120 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2534	48	7707865306751	Besties - Golosinas Tiras Suaves para Perros Sabor Tocineta - 170 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2535	48	4913993141000	Rollitos De Res Three Pets - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2536	48	7707205158194	Agility Gold - Gatitos - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2537	48	7702207730454	Dermosyn Loción Dérmica - 50 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2538	48	7709548759823	Dowolf - Bombonera de Galletas - 1000 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2539	48	7707205157005	Chunky - Gatos Salmon Cordero - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2540	48	855958006693	Churu - Inaba Cat Snack 4 Piezas Chicken With Crab - 56 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2541	48	052742623801	Hill'S Pd-C/D Multicare Alimento Húmedo Gato Urinario Sabor Pollo - 5,5 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2542	48	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2543	48	7708694229174	Bonnat - Grain Free Feline Adult - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2544	48	7708228519542	Besties - Huesos Masticables Medianos Mix de Sabores - 5 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2545	48	7703381240050	NexGard - Perros De 25.1 Hasta 50 Kg. - 136 MG ALL	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2547	48	850044321704	Con Sentido - Tapetes Para Perros Pequeños (12x20x30) - 14 Unds	24	24	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2548	48	7707772810136	Freshly Catnip 120ml - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2549	48	7501072218162	Pro Plan -  Cat Urinary - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2550	48	7707232090740	Natural Freshly - Esencia Urovital - 25 MILILITRO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2551	48	PD400000099	Paw Day - Peluche Botella Perrona - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2552	48	842982081543	Houndations - Dog Snack Salmon - 113.4 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2553	48	7703220009909	Argos - Juguete Surtidos Mediano - SURTIDO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2554	48	7798042361083	Total Full LC - Perros De 10 Hasta 20Kg - 2 Tabletas	12	12	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2555	48	052742001135	Hill'S Pd - C/D Multicare Alimento Perro Cuidado Urinario Sabor Pollo - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2556	48	8445290570116	Pro Plan  Veterinary - Diets UR Cuidado Urinario - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2557	48	7707308880688	Pet Spa - Tapete Tradicional - 7 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2558	48	855958006624	Churu - Inaba Cat Chicken Fillet Grilled In Scallop Flavored Broth - 25 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2559	48	855958006662	Churu - Inaba Cat Atún y Salmón - 4 uds	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2560	48	7707205153496	Chunky Delicat Trozos De Salmón - 80 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2561	48	854871008920	Churu - Inaba Bites Chicken Wraps With Tuna Recipe - 3 uds	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2562	48	7707205157500	Chunky - Alimento Sabor a Pavo Menú Natural - 300 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2563	48	7707772810129	Aquí No Cat - Esencia - 240 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2564	48	073657009283	Evolve - Dog Bandeja Classic Crafted Meals Pollo - 99 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2565	48	7502010429190	Virbac - Milpro Cat Hasta 2 Kg - 4 TABLETAS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2566	48	7709010995605	Br For Dog - Dental Treats - 7 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2567	48	052742610900	Hill'S Sd - Adult Indoor Alimento Húmedo Gato De Interior Sabor Pollo - 5,5 OZ	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2568	48	052742945309	Hill'S Pd - K/D Alimento, Húmedo Gato Cuidado Renal Sabor Pollo  - 5,5 OZ	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2569	48	7707205151522	Chunky Delicat Pollo - 156 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2570	48	7707308880589	Natural Select - Galleta Maxi Bomb. - 454 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2571	48	7707865305853	Besties - Snacks Nuggets Gatos Sensitive - 75 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2572	48	7707865309196	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 6 Rollos - 120 bolsas	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2573	48	7798042363223	Holliday Ol- Trans 80G - 80 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2574	48	7703381243495	NexGard Spectra - Tableta Masticable para Perros 7.6 - 15 KG - 7.6 - 15 KG	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2575	48	3182550717120	Royal Canin - Fhn Savour Exigent - 400 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2576	48	074198612772	Diamond Naturals - Indoor Cat Lata - 5,5 OZ	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2577	48	030111771513	Royal Canin Hydrolyzed Protein Dog - 380 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2578	48	7798042366699	Attack - Gatos - 0.5 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2579	48	7707319650577	Mypet - Beff Jerky - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2580	48	7708388303036	Dog's Natural Care -  Jabón Origen Fusión Vital -  110 gr	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2581	48	7707232090993	Natural Freshly - Perfume Hembra Esbelt - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2582	48	7708574195131	Br For Cat - Lata Wild Trout - 400 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2583	48	8445290571045	Pro Plan  Veterinary - Diets NF Enfermedad Renal Etapa Avanzada - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2584	48	3023426023431	Paw Day - Dispensador Morado ** Gratis 1 Rollo Bolsas - ÚNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2585	48	7702487719682	CanAmor - Shampoo Piel Sensible - 230 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2586	48	7707865304313	Belly Treats - Cabano - 12 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2587	48	7707354230802	Miclor - Shampoo Miclor Proc - 250 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2588	48	052742186306	Hill'S Pd-I/D Low Fat Alimento Húmedo Perro Bajo En Grasa Sabor Original - 13 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2589	48	7798176421196	Labyes - Ciprovet - 5 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2590	48	7707232090436	Natural Freshly - Esencia Duelo - 25 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2591	48	38100119339	Pro Plan Veterinary Diets - Supplement Fortiflora X 30 Unid - 900 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2592	48	7501072209818	FELIX CLASSIC con Pescado Blanco - 85 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2593	48	7707205153472	Chunky Delicat Trozos De Pavo - 80 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2594	48	7709399777472	Br For Cat Control Bolas De Pelos - 60 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2595	48	023100119335	Temptations - Snack Para Gatos Adultos Camarón - 180 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2596	48	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2597	48	023100604015	Royal Canin Urinary Dog Lata - 385 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2598	48	29534752161	Salvaje - Galletas para Gato Piel y Pelaje - 70 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2599	48	7707865301855	Besties - Snacks Nuggets Gatos Limpieza Dental - 75 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2600	48	7703381243518	NexGard Spectra - Tableta Masticable para Perros 30.1 - 60 KG - 30.1 - 60 KG	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2601	48	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2602	48	850006715336	Churu - Inaba Cat Diet - 50 UN	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2603	48	030111604484	Royal Canin - Adult Instinctive - 85  GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2604	48	8470000957512	Vecol Renalof Pets - 150 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2605	48	050000290598	Félix - Paté Pescado Y Atún - 156  GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2606	48	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	31	31	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2607	48	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2608	48	3182550768474	Royal Canin - Satiety Cat - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2609	48	052742852300	Hill'S Sd - Alimento Gato Adulto Piel Y Estómago Sensible Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2610	48	5414736042992	Revolution Plus - Antiparasitario Gatos TBX1 (2,5 Kg a 5 Kg) - 0,5 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2611	48	850044321711	Con Sentido - Tapetes  Para Perros Grandes (12x19x34.5) - 14 Unds	22	22	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2612	48	4014355222433	Dr Clauders - Pavo y Arroz - 800 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2613	48	4014355339506	Dr. Clauders -  Cordero y arroz - 1 KG	1	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2614	48	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2615	48	7898053582795	Vetnil - VitaVet C - 30 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2616	48	7707865305488	Belly Treats - Mix Parrillero - 200 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2617	48	7891000247846	Pro Plan - Alimento Humedo Gato Esterilizado 15 Sobres de 85 g - 15 Sobres x85 g	12	12	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2618	48	38100120144	Pro Plan Veterinary Diets - UR Urinary Care Feline - 156 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2619	48	7708304362987	Basic Farm - Baxidin Solucion Antiseptica - 300 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2620	48	855958006679	Churu - Inaba Cat Snack 4 Piezas Chicken With Cheese - 56 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2621	48	7707205152918	Chunky - Lata Sabor Estofado De Res - 400 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2622	48	076484136061	Coastal Pet - Perro Bozal Basket - Talla 2	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2623	48	5414736047935	Simparica - Perros De 10 Hasta 20 Kg. - 1 Tableta	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2624	48	7707205152871	Agility Gold - Cachorros Primera Fase - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2625	48	7707865307048	Besties - Snacks Nuggets Gatos Sabor Salmón - 75 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2626	48	4913993146005	Codillos De Res Three Pets - 190 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2627	48	857276007642	Churu - Inaba Tuna Variety Pack Bombonera - 50 uds	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2628	48	7707205153434	Chunky - Pouch Delidog Trozos De Carne De Res Adulto - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2629	48	7703681044716	Achiras Para Perro De Ternera - 150 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2630	48	7702084057101	Oh Maigat! - Caseros Y Delicados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2631	48	7898574026853	Hydra - Colonia Groomers Forever Candy - 130 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2632	48	7707319650508	Mypet - Bombonera Mix - 483 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2633	48	7501072213839	Fancy Feast - Petit Filets Salmón Pouch - 85 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2634	48	7704614020104	Laboratorio Zoo - Alernex 10 tabletas - 10  MEDICAMENTOS	1	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:45:04.048869
2635	48	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2636	48	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2637	48	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2638	48	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2639	48	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2640	48	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2641	48	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2642	48	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2643	48	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2644	48	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2645	48	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2646	48	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2647	48	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2648	48	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2649	48	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2650	48	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2651	48	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2652	48	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2653	48	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-21 20:45:04.048869
2532	48	7708304364400	Basic Farm - Baxidin - 60 MILILITRO	3	3	3	sin_novedad		VE24681	2025-09-21 20:45:04.048869
2546	48	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	36	36	36	sin_novedad		VE24681	2025-09-21 20:45:04.048869
2654	49	052742660059	Hills - Science Diet Kitten Savory Chicken Entrée - 5,5 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2655	49	7707115301703	Compañía California - Metrodix 8% - 60 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2656	49	38100179029	Pro Plan Veterinary Diets - NF Kidney Function Advanced Care Feline - 156 GR	15	15	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2657	49	7707772810334	Natural Freshly - Ambientador Antiestres Biopronnabis CBD - 240 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2658	49	815260005258	Go! - Carnivore Grain-Free Chicken Turkey+Duck Cat - 1.4 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2659	49	706460000641	Whiskas - Alimento Húmedo Gatos Salmon - 85  GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2660	49	7700184000300	Probiodog - Caja - 10 SOBRES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2661	49	052742338903	Hill'S Pd - I/D Alimento Húmedo Perro Cuidado Digestivo Sabor Pollo - 12,5 OZ	30	30	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2662	49	7708388303210	Dog's Natural Care -  Jabón Origen Spa Herbal - 110 gr	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2663	49	7702195205903	Bussie - Stomizol 20 mg Caja - 10 Tab	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2664	49	7797453971843	Pedigree - Dentastix Snack Perro Adulto - 7 BARRAS	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2665	49	PD400000142	Paw Day - Juguete Interactivo Taches - MORADO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2666	49	7708574195209	Tommy - Pouch Gato Adulto Trozos de Salmón Y Bacalao en Salsa - 100 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2667	49	7896588951963	Max - Cat Gatito Pollo - 1 KG	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2668	49	810833020003	Smartbones Sweet Potato Mini - 8 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2669	49	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2670	49	7702521276874	Dog Chow - Alimento Húmedo Para Perros Precio Especial Pack x5 - 500 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2671	49	7613039947630	Pro Plan - Estirilizados con OptiRenal - 1 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2672	49	7703681042590	Galletas Quínoa Energy Razas Grandes - 250 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2673	49	3182550711159	Royal Canin - Urinary So Cat - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2674	49	4007221055457	Baytril - Tabletas 50 - 10  MEDICAMENTOS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2675	49	7708786723962	Esencias Gabrica - Esencias Florales De Agresividad - SPRAY 250 ml MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2676	49	7707205159146	Agility Gold - Premios - 250 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2677	49	7707205154974	Chunky - Pollo Gatos - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2678	49	030111604408	Royal Canin - Kitten Instinctive - 85 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2679	49	7703090368403	Nutriss - Perros Adult Salsa Carne - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2680	49	855958006556	Churu - Inaba Cat Atún - 4 uds	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2681	49	7707205153144	Chunky Deli Caprichos Tocineta Snack - 160 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2682	49	7707308880312	Petlabs - Clorexy Pet Oral - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2683	49	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2684	49	7707205153052	Dog Yurt - Chunky Delidog Snack para Perros - 160 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2685	49	7709141799677	Feliway - Friends Recarga. - 48 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2686	49	7702084057132	Donkat - Gatitos - 1 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2687	49	7501072209801	Félix Classic Con Atún - 85 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2688	49	7709548759885	Dowolf - Galletas Mixtas Pollo y Ternera - 200 GR	6	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2689	49	7708228519214	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 1.5 KG	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2690	49	052742296807	Hill'S Sd - Perfect Weight Alimento Gato Peso Perfecto Sabor Pollo - 3 LB	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2691	49	857276007697	Churu - Inaba Cat Snack Churu Bombonera Variedad De Pollo y Atún 700 g - 50 Uds	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2692	49	030111471574	Royal Canin - Alimento Húmedo Spayed Neutered - 85 GR	39	39	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2693	49	706460000689	Whiskas - Alimento Húmedo Gatos Res - 85  GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2694	49	7708574195377	Tommy - Pouch Perro Adulto Trozos de Res con Verduras Salsa - 100 GR	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2695	49	7798042365906	Holliday - Cardial B 2.5 mg - 20 comprimidos	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2696	49	7707205150860	Pote Chunky Delicat Pollo - 156 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2697	49	7709141799615	Feliway - Multicat Difusor + Recarga. - 48 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2698	49	3182550743228	Royal Canin - Shih Tzu Adulto - 1.5 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2699	49	3182550707305	Royal Canin - Mother y Babycat - 400 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2700	49	7708574195087	Tommy - Pouch Perro Adulto Trozos de Pollo con Verduras Salsa - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2701	49	7706358000879	Lindopel - Suplemento Perros y Gatos - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2702	49	7707772810730	Natural Freshly - Bucocare Enjuague Bucal Menta - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2703	49	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2704	49	3182550702157	Royal Canin - Regular Fit - 400 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2705	49	7898604436706	N&D - Tropical Selection Fel Castrado Frango - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2706	49	052742014531	Hill'S Pd - Metabolic Treats Premios Saludables Para Perro Sabor Pollo - 340 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2707	49	7709214028833	Animal Lovers Sándwich Bone Mix - 350 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2708	49	7501072209788	FELIX CLASSIC con Carne - 85 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2709	49	7501072214560	Pro Plan - Alimento húmeto para gatitos - 85 GR	13	13	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2710	49	8470000107511	Vecol - Asbrip Pets. - 150 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2711	49	PD400000075	Paw Day - Peluche Araña - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2712	49	164100000219	Paw Day – Combo Pelotas Tipo Tenis Interactivas para Snacks - 3 UNIDADES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2713	49	38100179005	Pro Plan  Veterinary - Diets NF Enfermedad Renal Etapa Inicial - 1.4 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2714	49	7707205153465	Chunky - Pouch Delidog Trozos De Pavo Adulto - 250 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2715	49	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2716	49	7898019868055	Ourofino - Petcell - 50 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2717	49	7707865309332	Belly Treats - Huesos 3 - 4 - 3 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2718	49	7703381243488	NexGard Spectra - Tableta Masticable para Perros 3.6 - 7.5 KG - 3.6 - 7.5 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2719	49	7707214570239	Bismopet - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2720	49	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2721	49	7709447496751	BR FOR CAT -  Snack Hairball Control Bola de Pelos - 350 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2722	49	030111435538	Royal Cain - Appetite Control Wet - 85 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2723	49	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	13	13	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2724	49	7898604433262	N&D - Prime Feline Frango Adult Castrado - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2725	49	052742700809	Hill'S Pd- I/D Cuidado Digestivo Alimento Húmedo Perro Sabor Pavo - 13 OZ	35	35	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2726	49	7709189726635	Feliway - Classic Recarga. - 48 MILILITRO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2727	49	7707308880671	Pet Spa - Tapete Tradicional - 14 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2728	49	4913993142311	Bombonera Rollitos De Res Three Pets - 250 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2729	49	7708786723498	Esencias Gabrica - Esencias Florales De Estrés - GOTERO 30 ml MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2730	49	PD400000103	Paw Day - Combo Duo Pelotas Luz Gato - GATO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2731	49	7708388303463	Dog's Natural Care - Bálsamo Humectante - 21 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2732	49	7709129857924	MICHIKO - Alimento Húmedo Cremoso - 4 Sachets	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2733	49	030111472533	Royal Canin - Renal Support E Dog Wet - 385 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2734	49	073657009306	Evolve - Dog Bandeja Classic Crafted Meals Salmon - 99 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2735	49	7898053580883	Vetnil - Glicopan - 125 ML MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2736	49	6942133300814	Calcium Milk Bone - 12 UNIDADES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2737	49	030111470713	Royal Canin VHN - Gastro Intestinal Low Fat Lata - 385 GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2738	49	7707772810723	Natural Freshly - Derma Clean Limpiador Lagrimal - 120 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2739	49	030111442956	Royal Canin VHN - Urinary Gato Lata - 145 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2740	49	7707232090979	Natural Freshly - Vita Crunch Urovital - 50 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2741	49	7703889125705	Cutamycon Loción - 50 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2742	49	7708574195599	Br For Cat - Lata Wild Ocean Fish - 400 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2743	49	7707205159122	Italcol  - Menú Natural Cremoso Gato Surtido Bolsa x 6 Unidades - 78 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2744	49	7898053599502	Organew - Suplemento. - 100 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2745	49	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2746	49	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2747	49	7707205154240	Agility Gold - Pouch Trozos De Pavo Adulto - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2748	49	7707308882156	Natural Select - Galleta Parrillada - 1000 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2749	49	38100136350	Pro Plan Veterinary Diets - EN Dietas Gastroenteric Feline - 156 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2750	49	7708228519818	Besties - Huesos Masticables Mini Sabor Mantequilla de Mani - 9 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2751	49	7896588944538	Equilibrio - F Gatos Adulto - 1,5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2752	49	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2753	49	7707865302456	Belly Treats - Barquillo - 6 uds	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2754	49	7707205155438	Agility Gold - Prescripción Enterico Soporte Gastrointestinal Lata - 360 GR	23	23	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2755	49	4014355624725	Dr Clauders - Cat Intestinal - 200 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2756	49	7702521772475	Fancy Feast - Alimento Húmedo Petits Filets Pague 4 Lleve 5 Sobres - 425 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2757	49	7707232097947	Natural Freshly - Glucosamina + Condroitina x Caja - 15 Sobres	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2758	49	7707308880008	Pet Spa - Cepillo Deslanador Gatos - Único	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2759	49	7707232094731	Natural Freshly - Digestar Fibra x Caja - 12 Sobres	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2760	49	7707205151539	Chunky Delicat Salmón - 156 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2761	49	7891000332344	One - Multiproteínas Perros Cachorros Y Adultos  Carne, Pollo Y Cordero - 85 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2762	49	7896588944521	Equilibrio - F Gato Filhote - 1,5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2763	49	7898604433231	N&D - Prime Feline Frango Adult - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2764	49	4913993141659	Trocitos Mix Three Pets - 120 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2765	49	7702487033016	CanAmor - Talco Desodorante - 100 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2766	49	7707319650027	Mypet - Hueso Cerdo - Unidad	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2767	49	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2768	49	8445290179630	Fancy Feast - Purée Kiss Con Atún y Salmón en Salsa Cremosa - 40 gr	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2769	49	7708808596659	Tommy Pets - Pañitos Humedos - 100 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2770	49	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2771	49	7707232090863	Natural Freshly - Mieltertos Suspensión - 180 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2772	49	7707007406912	Pets Kingdom  - Puloff x 1,34 ml  11- 20 kg - 1,34 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2773	49	4007221055402	Advocate - Pipeta Solución Tópica Gatos Hasta 8 Kg - 0.8 MILILITRO	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2774	49	7798042360246	Total Full LC - Perros De 20 Hasta 60 Kg - 3 Tabletas	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2775	49	052742339009	Hill'S Pd - I/D Alimento Húmedo Perro Cuidado Digestivo Sabor Pollo - 5,5 OZ	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2776	49	7709049265786	BR FOR CAT -  Snack Play Catnip - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2777	49	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2778	49	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2779	49	7707205154530	Agility Gold - Pouch Trozos De Cordero Adulto - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2780	49	29534752157	Galletas De Cordero Y Arroz Laika By Rausch - 150 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2781	49	050000290482	Félix - Paté Salmón - 156  GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2782	49	736990005168	Shed X - Suplemento Perros. - 16 OZ	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2783	49	7709990740271	Artri-Tabs - Tabletas Saborizadas. - 45 MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2784	49	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2785	49	PD400000001	Paw Day - Peluche Galleta de Jengibre - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2786	49	7707903300147	Natural Select - Salsa Natural Select Gatos Sabor a Pollo - 220 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2787	49	7707321675131	PETMED-Hidratante - 60 MILILITRO	4	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2788	49	7707308881746	Pet Spa - Tapete Con Carbon Activo - 14 Und	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2789	49	0781159484933	Reeld´s - Medical Pet Tgi Tripack - 825 GR	27	27	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2790	49	7707903300338	Natural Select - Salsa Natural Select Gatos Sabor a Carne - 220 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2791	49	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2792	49	7707007405663	Pets Kingdom  - Fortipet Frasco - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2793	49	7708808596895	Tommy - Snack Cats Skin And Coat - 75 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2794	49	7707232090917	Natural Freshly - Vita Crunch Flex Artrit - 50 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2795	49	035585131474	Kong - Hueso Con Cuerda Cachorros. - XS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2796	49	7708574195230	Br For Cat - Lata Wild Salmon - 400 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2797	49	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2798	49	7708388303579	Dog's Natural Care - Bálsamo Curativo - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2799	49	3182550784566	Royal Canin - Sterilised 7+ - 1.5 KG	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2800	49	7708304364400	Basic Farm - Baxidin - 60 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2801	49	7702578829023	Mirrapel - Oleoso. - 120 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2802	49	7707865306751	Besties - Golosinas Tiras Suaves para Perros Sabor Tocineta - 170 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2803	49	4913993141000	Rollitos De Res Three Pets - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2804	49	7707205158194	Agility Gold - Gatitos - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2805	49	7702207730454	Dermosyn Loción Dérmica - 50 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2806	49	7709548759823	Dowolf - Bombonera de Galletas - 1000 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2807	49	7707205157005	Chunky - Gatos Salmon Cordero - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2808	49	855958006693	Churu - Inaba Cat Snack 4 Piezas Chicken With Crab - 56 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2809	49	052742623801	Hill'S Pd-C/D Multicare Alimento Húmedo Gato Urinario Sabor Pollo - 5,5 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2810	49	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2811	49	7708694229174	Bonnat - Grain Free Feline Adult - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2812	49	7708228519542	Besties - Huesos Masticables Medianos Mix de Sabores - 5 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2813	49	7703381240050	NexGard - Perros De 25.1 Hasta 50 Kg. - 136 MG ALL	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2814	49	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	36	36	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2815	49	850044321704	Con Sentido - Tapetes Para Perros Pequeños (12x20x30) - 14 Unds	24	24	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2816	49	7707772810136	Freshly Catnip 120ml - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2817	49	7501072218162	Pro Plan -  Cat Urinary - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2818	49	7707232090740	Natural Freshly - Esencia Urovital - 25 MILILITRO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2819	49	PD400000099	Paw Day - Peluche Botella Perrona - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2820	49	842982081543	Houndations - Dog Snack Salmon - 113.4 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2821	49	7703220009909	Argos - Juguete Surtidos Mediano - SURTIDO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2822	49	7798042361083	Total Full LC - Perros De 10 Hasta 20Kg - 2 Tabletas	12	12	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2823	49	052742001135	Hill'S Pd - C/D Multicare Alimento Perro Cuidado Urinario Sabor Pollo - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2824	49	8445290570116	Pro Plan  Veterinary - Diets UR Cuidado Urinario - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2825	49	7707308880688	Pet Spa - Tapete Tradicional - 7 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2826	49	855958006624	Churu - Inaba Cat Chicken Fillet Grilled In Scallop Flavored Broth - 25 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2827	49	855958006662	Churu - Inaba Cat Atún y Salmón - 4 uds	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2828	49	7707205153496	Chunky Delicat Trozos De Salmón - 80 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2829	49	854871008920	Churu - Inaba Bites Chicken Wraps With Tuna Recipe - 3 uds	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2830	49	7707205157500	Chunky - Alimento Sabor a Pavo Menú Natural - 300 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2831	49	7707772810129	Aquí No Cat - Esencia - 240 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2832	49	073657009283	Evolve - Dog Bandeja Classic Crafted Meals Pollo - 99 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2833	49	7502010429190	Virbac - Milpro Cat Hasta 2 Kg - 4 TABLETAS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2834	49	7709010995605	Br For Dog - Dental Treats - 7 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2835	49	052742610900	Hill'S Sd - Adult Indoor Alimento Húmedo Gato De Interior Sabor Pollo - 5,5 OZ	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2836	49	052742945309	Hill'S Pd - K/D Alimento, Húmedo Gato Cuidado Renal Sabor Pollo  - 5,5 OZ	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2837	49	7707205151522	Chunky Delicat Pollo - 156 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2838	49	7707308880589	Natural Select - Galleta Maxi Bomb. - 454 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2839	49	7707865305853	Besties - Snacks Nuggets Gatos Sensitive - 75 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2840	49	7707865309196	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 6 Rollos - 120 bolsas	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2841	49	7798042363223	Holliday Ol- Trans 80G - 80 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2842	49	7703381243495	NexGard Spectra - Tableta Masticable para Perros 7.6 - 15 KG - 7.6 - 15 KG	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2843	49	3182550717120	Royal Canin - Fhn Savour Exigent - 400 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2844	49	074198612772	Diamond Naturals - Indoor Cat Lata - 5,5 OZ	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2845	49	030111771513	Royal Canin Hydrolyzed Protein Dog - 380 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2846	49	7798042366699	Attack - Gatos - 0.5 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2847	49	7707319650577	Mypet - Beff Jerky - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2848	49	7708388303036	Dog's Natural Care -  Jabón Origen Fusión Vital -  110 gr	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2849	49	7707232090993	Natural Freshly - Perfume Hembra Esbelt - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2850	49	7708574195131	Br For Cat - Lata Wild Trout - 400 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2851	49	8445290571045	Pro Plan  Veterinary - Diets NF Enfermedad Renal Etapa Avanzada - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2852	49	3023426023431	Paw Day - Dispensador Morado ** Gratis 1 Rollo Bolsas - ÚNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2853	49	7702487719682	CanAmor - Shampoo Piel Sensible - 230 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2854	49	7707865304313	Belly Treats - Cabano - 12 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2855	49	7707354230802	Miclor - Shampoo Miclor Proc - 250 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2856	49	052742186306	Hill'S Pd-I/D Low Fat Alimento Húmedo Perro Bajo En Grasa Sabor Original - 13 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2857	49	7798176421196	Labyes - Ciprovet - 5 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2858	49	7707232090436	Natural Freshly - Esencia Duelo - 25 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2859	49	38100119339	Pro Plan Veterinary Diets - Supplement Fortiflora X 30 Unid - 900 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2860	49	7501072209818	FELIX CLASSIC con Pescado Blanco - 85 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2861	49	7707205153472	Chunky Delicat Trozos De Pavo - 80 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2862	49	7709399777472	Br For Cat Control Bolas De Pelos - 60 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2863	49	023100119335	Temptations - Snack Para Gatos Adultos Camarón - 180 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2864	49	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2865	49	023100604015	Royal Canin Urinary Dog Lata - 385 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2866	49	29534752161	Salvaje - Galletas para Gato Piel y Pelaje - 70 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2867	49	7707865301855	Besties - Snacks Nuggets Gatos Limpieza Dental - 75 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2868	49	7703381243518	NexGard Spectra - Tableta Masticable para Perros 30.1 - 60 KG - 30.1 - 60 KG	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2869	49	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2870	49	850006715336	Churu - Inaba Cat Diet - 50 UN	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2871	49	030111604484	Royal Canin - Adult Instinctive - 85  GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2872	49	8470000957512	Vecol Renalof Pets - 150 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2873	49	050000290598	Félix - Paté Pescado Y Atún - 156  GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2874	49	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	31	31	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2875	49	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2876	49	3182550768474	Royal Canin - Satiety Cat - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2877	49	052742852300	Hill'S Sd - Alimento Gato Adulto Piel Y Estómago Sensible Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2878	49	5414736042992	Revolution Plus - Antiparasitario Gatos TBX1 (2,5 Kg a 5 Kg) - 0,5 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2879	49	850044321711	Con Sentido - Tapetes  Para Perros Grandes (12x19x34.5) - 14 Unds	22	22	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2880	49	4014355222433	Dr Clauders - Pavo y Arroz - 800 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2881	49	4014355339506	Dr. Clauders -  Cordero y arroz - 1 KG	1	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2882	49	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2883	49	7898053582795	Vetnil - VitaVet C - 30 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2884	49	7707865305488	Belly Treats - Mix Parrillero - 200 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2885	49	7891000247846	Pro Plan - Alimento Humedo Gato Esterilizado 15 Sobres de 85 g - 15 Sobres x85 g	12	12	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2886	49	38100120144	Pro Plan Veterinary Diets - UR Urinary Care Feline - 156 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2887	49	7708304362987	Basic Farm - Baxidin Solucion Antiseptica - 300 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2888	49	855958006679	Churu - Inaba Cat Snack 4 Piezas Chicken With Cheese - 56 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2889	49	7707205152918	Chunky - Lata Sabor Estofado De Res - 400 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2890	49	076484136061	Coastal Pet - Perro Bozal Basket - Talla 2	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2891	49	5414736047935	Simparica - Perros De 10 Hasta 20 Kg. - 1 Tableta	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2892	49	7707205152871	Agility Gold - Cachorros Primera Fase - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2893	49	7707865307048	Besties - Snacks Nuggets Gatos Sabor Salmón - 75 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2894	49	4913993146005	Codillos De Res Three Pets - 190 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2895	49	857276007642	Churu - Inaba Tuna Variety Pack Bombonera - 50 uds	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2896	49	7707205153434	Chunky - Pouch Delidog Trozos De Carne De Res Adulto - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2897	49	7703681044716	Achiras Para Perro De Ternera - 150 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2898	49	7702084057101	Oh Maigat! - Caseros Y Delicados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2899	49	7898574026853	Hydra - Colonia Groomers Forever Candy - 130 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2900	49	7707319650508	Mypet - Bombonera Mix - 483 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2901	49	7501072213839	Fancy Feast - Petit Filets Salmón Pouch - 85 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2902	49	7704614020104	Laboratorio Zoo - Alernex 10 tabletas - 10  MEDICAMENTOS	1	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:52:37.390925
2903	49	7702521409937	Excellent - Urinary Cat - 1 KG	3	3	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2904	49	052742930107	Hill'S Sd - Light Alimento Perro Adulto Bocados Pequeños Sabor Pollo - 5 LB	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2905	49	6920300000262	Colmascotas - Fuente Importada Invierno Flor Rosada - ÚNICA	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2906	49	7708228519115	Let's Be Fresh - Pañitos Húmedos para Mascotas - 80 UND	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2907	49	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2908	49	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	4	4	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2909	49	7896588951994	Max - Cat Castrados - 3 KG	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2910	49	7707205153359	Chunky - Pollo Adultos - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2911	49	8713184147646	Bravecto - Perros De 20 Hasta 40 Kg - 1000 Mlg MILILITRO	2	2	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2912	49	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	20	20	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2913	49	4007221050858	Advantage - Antipulgas Perros De 4 Hasta 10 Kg. - 1 MILILITRO	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2914	49	7702521106799	Excellent - Adulto Maintenance Formula - 3 KG	6	6	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2915	49	052742909806	Hills - Science Diet Adult 7+ Small Paws Chicken Meal Dog - 4,5 LB	8	8	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2916	49	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	5	5	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2917	49	29534752158	Galletas De Fibra Y Control Bola De Pelos Laika By Rausch - 65 GR	24	24	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2918	49	7707205153779	Dog Yurt - Chunky Nutribar Snack para Perros - 160 GR	7	7	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2919	49	7708228519009	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 4 KG	1	1	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2920	49	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	18	18	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2921	49	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	22	22	\N	sin_novedad	\N	VE24559	2025-09-21 20:52:37.390925
2922	50	052742660059	Hills - Science Diet Kitten Savory Chicken Entrée - 5,5 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2923	50	7707115301703	Compañía California - Metrodix 8% - 60 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2924	50	38100179029	Pro Plan Veterinary Diets - NF Kidney Function Advanced Care Feline - 156 GR	15	15	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2925	50	7707772810334	Natural Freshly - Ambientador Antiestres Biopronnabis CBD - 240 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2926	50	815260005258	Go! - Carnivore Grain-Free Chicken Turkey+Duck Cat - 1.4 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2927	50	706460000641	Whiskas - Alimento Húmedo Gatos Salmon - 85  GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2928	50	7700184000300	Probiodog - Caja - 10 SOBRES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2929	50	052742338903	Hill'S Pd - I/D Alimento Húmedo Perro Cuidado Digestivo Sabor Pollo - 12,5 OZ	30	30	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2930	50	7708388303210	Dog's Natural Care -  Jabón Origen Spa Herbal - 110 gr	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2931	50	7702195205903	Bussie - Stomizol 20 mg Caja - 10 Tab	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2932	50	7797453971843	Pedigree - Dentastix Snack Perro Adulto - 7 BARRAS	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2933	50	PD400000142	Paw Day - Juguete Interactivo Taches - MORADO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2934	50	7708574195209	Tommy - Pouch Gato Adulto Trozos de Salmón Y Bacalao en Salsa - 100 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2935	50	7896588951963	Max - Cat Gatito Pollo - 1 KG	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2936	50	810833020003	Smartbones Sweet Potato Mini - 8 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2937	50	7702487748217	CanAmor - Shampoo Arbol De Te Gatos - 230 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2938	50	7702521276874	Dog Chow - Alimento Húmedo Para Perros Precio Especial Pack x5 - 500 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2939	50	7613039947630	Pro Plan - Estirilizados con OptiRenal - 1 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2940	50	7703681042590	Galletas Quínoa Energy Razas Grandes - 250 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2941	50	3182550711159	Royal Canin - Urinary So Cat - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2942	50	4007221055457	Baytril - Tabletas 50 - 10  MEDICAMENTOS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2943	50	7708786723962	Esencias Gabrica - Esencias Florales De Agresividad - SPRAY 250 ml MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2944	50	7707205159146	Agility Gold - Premios - 250 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2945	50	7707205154974	Chunky - Pollo Gatos - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2946	50	030111604408	Royal Canin - Kitten Instinctive - 85 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2947	50	7703090368403	Nutriss - Perros Adult Salsa Carne - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2948	50	855958006556	Churu - Inaba Cat Atún - 4 uds	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2949	50	7707205153144	Chunky Deli Caprichos Tocineta Snack - 160 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2950	50	7707308880312	Petlabs - Clorexy Pet Oral - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2951	50	850030015365	Churu - Inaba Cat Chicken With Salmon Recipe 4 Piezas - 56 GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2952	50	7707205153052	Dog Yurt - Chunky Delidog Snack para Perros - 160 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2953	50	7709141799677	Feliway - Friends Recarga. - 48 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2954	50	7702084057132	Donkat - Gatitos - 1 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2955	50	7501072209801	Félix Classic Con Atún - 85 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2956	50	7709548759885	Dowolf - Galletas Mixtas Pollo y Ternera - 200 GR	6	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2957	50	7708228519214	True Nature - Alimento Gatos Adultos Sabor Salmón y Vegetales - 1.5 KG	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2958	50	052742296807	Hill'S Sd - Perfect Weight Alimento Gato Peso Perfecto Sabor Pollo - 3 LB	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2959	50	857276007697	Churu - Inaba Cat Snack Churu Bombonera Variedad De Pollo y Atún 700 g - 50 Uds	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2960	50	030111471574	Royal Canin - Alimento Húmedo Spayed Neutered - 85 GR	39	39	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2961	50	706460000689	Whiskas - Alimento Húmedo Gatos Res - 85  GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2962	50	7708574195377	Tommy - Pouch Perro Adulto Trozos de Res con Verduras Salsa - 100 GR	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2963	50	7798042365906	Holliday - Cardial B 2.5 mg - 20 comprimidos	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2964	50	7707205150860	Pote Chunky Delicat Pollo - 156 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2965	50	7709141799615	Feliway - Multicat Difusor + Recarga. - 48 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2966	50	3182550743228	Royal Canin - Shih Tzu Adulto - 1.5 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2967	50	3182550707305	Royal Canin - Mother y Babycat - 400 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2968	50	7708574195087	Tommy - Pouch Perro Adulto Trozos de Pollo con Verduras Salsa - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2969	50	7706358000879	Lindopel - Suplemento Perros y Gatos - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2970	50	7707772810730	Natural Freshly - Bucocare Enjuague Bucal Menta - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2971	50	PD400000126	Paw Day - Juguete Mordedor Interactivo Pato - ROJO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2972	50	3182550702157	Royal Canin - Regular Fit - 400 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2973	50	7898604436706	N&D - Tropical Selection Fel Castrado Frango - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2974	50	052742014531	Hill'S Pd - Metabolic Treats Premios Saludables Para Perro Sabor Pollo - 340 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2975	50	7709214028833	Animal Lovers Sándwich Bone Mix - 350 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2976	50	7501072209788	FELIX CLASSIC con Carne - 85 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2977	50	7501072214560	Pro Plan - Alimento húmeto para gatitos - 85 GR	13	13	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2978	50	8470000107511	Vecol - Asbrip Pets. - 150 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2979	50	PD400000075	Paw Day - Peluche Araña - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2980	50	164100000219	Paw Day – Combo Pelotas Tipo Tenis Interactivas para Snacks - 3 UNIDADES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2981	50	38100179005	Pro Plan  Veterinary - Diets NF Enfermedad Renal Etapa Inicial - 1.4 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2982	50	7707205153465	Chunky - Pouch Delidog Trozos De Pavo Adulto - 250 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2983	50	7708304363472	Basic Farm - Basic Din Toallas - 100 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2984	50	7898019868055	Ourofino - Petcell - 50 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2985	50	7707865309332	Belly Treats - Huesos 3 - 4 - 3 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2986	50	7703381243488	NexGard Spectra - Tableta Masticable para Perros 3.6 - 7.5 KG - 3.6 - 7.5 KG	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2987	50	7707214570239	Bismopet - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2988	50	052742462806	Hill'S Pd - I/D Alimento Húmedo Para Gato Cuidado Digestivo Sabor Pollo - 5,5 OZ	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2989	50	7709447496751	BR FOR CAT -  Snack Hairball Control Bola de Pelos - 350 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2990	50	030111435538	Royal Cain - Appetite Control Wet - 85 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2991	50	7703381243501	NexGard Spectra - Tableta Masticable para Perros 15.1 - 30 KG - 15.1 - 30 KG	13	13	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2992	50	7898604433262	N&D - Prime Feline Frango Adult Castrado - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2993	50	052742700809	Hill'S Pd- I/D Cuidado Digestivo Alimento Húmedo Perro Sabor Pavo - 13 OZ	35	35	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2994	50	7709189726635	Feliway - Classic Recarga. - 48 MILILITRO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2995	50	7707308880671	Pet Spa - Tapete Tradicional - 14 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2996	50	4913993142311	Bombonera Rollitos De Res Three Pets - 250 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2997	50	7708786723498	Esencias Gabrica - Esencias Florales De Estrés - GOTERO 30 ml MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2998	50	PD400000103	Paw Day - Combo Duo Pelotas Luz Gato - GATO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
2999	50	7708388303463	Dog's Natural Care - Bálsamo Humectante - 21 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3000	50	7709129857924	MICHIKO - Alimento Húmedo Cremoso - 4 Sachets	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3001	50	030111472533	Royal Canin - Renal Support E Dog Wet - 385 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3002	50	073657009306	Evolve - Dog Bandeja Classic Crafted Meals Salmon - 99 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3003	50	7898053580883	Vetnil - Glicopan - 125 ML MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3004	50	6942133300814	Calcium Milk Bone - 12 UNIDADES	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3005	50	030111470713	Royal Canin VHN - Gastro Intestinal Low Fat Lata - 385 GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3006	50	7707772810723	Natural Freshly - Derma Clean Limpiador Lagrimal - 120 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3007	50	030111442956	Royal Canin VHN - Urinary Gato Lata - 145 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3008	50	7707232090979	Natural Freshly - Vita Crunch Urovital - 50 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3009	50	7703889125705	Cutamycon Loción - 50 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3010	50	7708574195599	Br For Cat - Lata Wild Ocean Fish - 400 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3011	50	7707205159122	Italcol  - Menú Natural Cremoso Gato Surtido Bolsa x 6 Unidades - 78 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3012	50	7898053599502	Organew - Suplemento. - 100 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3013	50	8713184147660	Bravecto - Perros De 40 Hasta 56 Kg - 1400 mg 1  MEDICAMENTOS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3014	50	29534752162	Salvaje - Galletas para Gato con Catnip y Vitaminas - 70 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3015	50	7707205154240	Agility Gold - Pouch Trozos De Pavo Adulto - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3016	50	7707308882156	Natural Select - Galleta Parrillada - 1000 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3017	50	38100136350	Pro Plan Veterinary Diets - EN Dietas Gastroenteric Feline - 156 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3018	50	7708228519818	Besties - Huesos Masticables Mini Sabor Mantequilla de Mani - 9 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3019	50	7896588944538	Equilibrio - F Gatos Adulto - 1,5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3020	50	850030015495	Churu - Inaba Cat Snack Churu Caja Variedad Pollo 280 g - 20 Uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3021	50	7707865302456	Belly Treats - Barquillo - 6 uds	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3022	50	7707205155438	Agility Gold - Prescripción Enterico Soporte Gastrointestinal Lata - 360 GR	23	23	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3023	50	4014355624725	Dr Clauders - Cat Intestinal - 200 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3024	50	7702521772475	Fancy Feast - Alimento Húmedo Petits Filets Pague 4 Lleve 5 Sobres - 425 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3025	50	7707232097947	Natural Freshly - Glucosamina + Condroitina x Caja - 15 Sobres	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3026	50	7707308880008	Pet Spa - Cepillo Deslanador Gatos - Único	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3027	50	7707232094731	Natural Freshly - Digestar Fibra x Caja - 12 Sobres	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3028	50	7707205151539	Chunky Delicat Salmón - 156 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3029	50	7891000332344	One - Multiproteínas Perros Cachorros Y Adultos  Carne, Pollo Y Cordero - 85 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3030	50	7896588944521	Equilibrio - F Gato Filhote - 1,5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3031	50	7898604433231	N&D - Prime Feline Frango Adult - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3032	50	4913993141659	Trocitos Mix Three Pets - 120 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3033	50	7702487033016	CanAmor - Talco Desodorante - 100 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3034	50	7707319650027	Mypet - Hueso Cerdo - Unidad	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3035	50	7707865308823	Belly Treats - Paticas de Gallina Premium - 7 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3036	50	8445290179630	Fancy Feast - Purée Kiss Con Atún y Salmón en Salsa Cremosa - 40 gr	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3037	50	7708808596659	Tommy Pets - Pañitos Humedos - 100 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3038	50	7707865306096	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 12 Rollos - 240 bolsas	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3039	50	7707232090863	Natural Freshly - Mieltertos Suspensión - 180 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3040	50	7707007406912	Pets Kingdom  - Puloff x 1,34 ml  11- 20 kg - 1,34 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3041	50	4007221055402	Advocate - Pipeta Solución Tópica Gatos Hasta 8 Kg - 0.8 MILILITRO	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3042	50	7798042360246	Total Full LC - Perros De 20 Hasta 60 Kg - 3 Tabletas	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3043	50	052742339009	Hill'S Pd - I/D Alimento Húmedo Perro Cuidado Digestivo Sabor Pollo - 5,5 OZ	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3044	50	7709049265786	BR FOR CAT -  Snack Play Catnip - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3045	50	7708304362970	Basic Farm - Dentyfarm Tubo - 30 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3046	50	7708228519450	Besties - Huesos Masticables Mini Sabor Pollo - 9 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3047	50	7707205154530	Agility Gold - Pouch Trozos De Cordero Adulto - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3048	50	29534752157	Galletas De Cordero Y Arroz Laika By Rausch - 150 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3049	50	050000290482	Félix - Paté Salmón - 156  GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3050	50	736990005168	Shed X - Suplemento Perros. - 16 OZ	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3051	50	7709990740271	Artri-Tabs - Tabletas Saborizadas. - 45 MEDICAMENTOS	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3052	50	7707205150730	Agility Gold - Gatos Esterilizados - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3053	50	PD400000001	Paw Day - Peluche Galleta de Jengibre - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3054	50	7707903300147	Natural Select - Salsa Natural Select Gatos Sabor a Pollo - 220 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3055	50	7707321675131	PETMED-Hidratante - 60 MILILITRO	4	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3056	50	7707308881746	Pet Spa - Tapete Con Carbon Activo - 14 Und	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3057	50	0781159484933	Reeld´s - Medical Pet Tgi Tripack - 825 GR	27	27	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3058	50	7707903300338	Natural Select - Salsa Natural Select Gatos Sabor a Carne - 220 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3059	50	854871008371	Churu Pops - Inaba Cat 4 Piezas Atún - 60 GR	11	11	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3060	50	7707007405663	Pets Kingdom  - Fortipet Frasco - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3061	50	7708808596895	Tommy - Snack Cats Skin And Coat - 75 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3062	50	7707232090917	Natural Freshly - Vita Crunch Flex Artrit - 50 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3063	50	035585131474	Kong - Hueso Con Cuerda Cachorros. - XS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3064	50	7708574195230	Br For Cat - Lata Wild Salmon - 400 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3065	50	7707865308816	Besties - Paté Alimento Húmedo Gatos Adultos Sabor Pescado - 100 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3066	50	7708388303579	Dog's Natural Care - Bálsamo Curativo - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3067	50	3182550784566	Royal Canin - Sterilised 7+ - 1.5 KG	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3068	50	7708304364400	Basic Farm - Baxidin - 60 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3069	50	7702578829023	Mirrapel - Oleoso. - 120 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3070	50	7707865306751	Besties - Golosinas Tiras Suaves para Perros Sabor Tocineta - 170 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3071	50	4913993141000	Rollitos De Res Three Pets - 60 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3072	50	7707205158194	Agility Gold - Gatitos - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3073	50	7702207730454	Dermosyn Loción Dérmica - 50 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3074	50	7709548759823	Dowolf - Bombonera de Galletas - 1000 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3075	50	7707205157005	Chunky - Gatos Salmon Cordero - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3076	50	855958006693	Churu - Inaba Cat Snack 4 Piezas Chicken With Crab - 56 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3077	50	052742623801	Hill'S Pd-C/D Multicare Alimento Húmedo Gato Urinario Sabor Pollo - 5,5 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3078	50	855958006587	Churu - Inaba Cat Atún y Viera - 4 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3079	50	7708694229174	Bonnat - Grain Free Feline Adult - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3080	50	7708228519542	Besties - Huesos Masticables Medianos Mix de Sabores - 5 uds	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3081	50	7703381240050	NexGard - Perros De 25.1 Hasta 50 Kg. - 136 MG ALL	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3082	50	7708574195995	Tommy - Pouch Gato Adulto Trozos de Trucha Y Camarón - 100 GR	36	36	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3083	50	850044321704	Con Sentido - Tapetes Para Perros Pequeños (12x20x30) - 14 Unds	24	24	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3084	50	7707772810136	Freshly Catnip 120ml - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3085	50	7501072218162	Pro Plan -  Cat Urinary - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3086	50	7707232090740	Natural Freshly - Esencia Urovital - 25 MILILITRO	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3087	50	PD400000099	Paw Day - Peluche Botella Perrona - UNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3088	50	842982081543	Houndations - Dog Snack Salmon - 113.4 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3089	50	7703220009909	Argos - Juguete Surtidos Mediano - SURTIDO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3090	50	7798042361083	Total Full LC - Perros De 10 Hasta 20Kg - 2 Tabletas	12	12	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3091	50	052742001135	Hill'S Pd - C/D Multicare Alimento Perro Cuidado Urinario Sabor Pollo - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3092	50	8445290570116	Pro Plan  Veterinary - Diets UR Cuidado Urinario - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3093	50	7707308880688	Pet Spa - Tapete Tradicional - 7 Und	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3094	50	855958006624	Churu - Inaba Cat Chicken Fillet Grilled In Scallop Flavored Broth - 25 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3095	50	855958006662	Churu - Inaba Cat Atún y Salmón - 4 uds	25	25	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3096	50	7707205153496	Chunky Delicat Trozos De Salmón - 80 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3097	50	854871008920	Churu - Inaba Bites Chicken Wraps With Tuna Recipe - 3 uds	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3098	50	7707205157500	Chunky - Alimento Sabor a Pavo Menú Natural - 300 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3099	50	7707772810129	Aquí No Cat - Esencia - 240 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3100	50	073657009283	Evolve - Dog Bandeja Classic Crafted Meals Pollo - 99 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3101	50	7502010429190	Virbac - Milpro Cat Hasta 2 Kg - 4 TABLETAS	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3102	50	7709010995605	Br For Dog - Dental Treats - 7 Unidades	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3103	50	052742610900	Hill'S Sd - Adult Indoor Alimento Húmedo Gato De Interior Sabor Pollo - 5,5 OZ	9	9	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3104	50	052742945309	Hill'S Pd - K/D Alimento, Húmedo Gato Cuidado Renal Sabor Pollo  - 5,5 OZ	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3105	50	7707205151522	Chunky Delicat Pollo - 156 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3106	50	7707308880589	Natural Select - Galleta Maxi Bomb. - 454 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3107	50	7707865305853	Besties - Snacks Nuggets Gatos Sensitive - 75 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3108	50	7707865309196	Let's Be Fresh - Bolsas Biodegradables Aroma Citronella 6 Rollos - 120 bolsas	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3109	50	7798042363223	Holliday Ol- Trans 80G - 80 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3110	50	7703381243495	NexGard Spectra - Tableta Masticable para Perros 7.6 - 15 KG - 7.6 - 15 KG	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3111	50	3182550717120	Royal Canin - Fhn Savour Exigent - 400 GR	10	10	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3112	50	074198612772	Diamond Naturals - Indoor Cat Lata - 5,5 OZ	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3113	50	030111771513	Royal Canin Hydrolyzed Protein Dog - 380 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3114	50	7798042366699	Attack - Gatos - 0.5 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3115	50	7707319650577	Mypet - Beff Jerky - 100 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3116	50	7708388303036	Dog's Natural Care -  Jabón Origen Fusión Vital -  110 gr	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3117	50	7707232090993	Natural Freshly - Perfume Hembra Esbelt - 120 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3118	50	7708574195131	Br For Cat - Lata Wild Trout - 400 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3119	50	8445290571045	Pro Plan  Veterinary - Diets NF Enfermedad Renal Etapa Avanzada - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3120	50	3023426023431	Paw Day - Dispensador Morado ** Gratis 1 Rollo Bolsas - ÚNICA	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3121	50	7702487719682	CanAmor - Shampoo Piel Sensible - 230 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3122	50	7707865304313	Belly Treats - Cabano - 12 uds	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3123	50	7707354230802	Miclor - Shampoo Miclor Proc - 250 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3124	50	052742186306	Hill'S Pd-I/D Low Fat Alimento Húmedo Perro Bajo En Grasa Sabor Original - 13 OZ	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3125	50	7798176421196	Labyes - Ciprovet - 5 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3126	50	7707232090436	Natural Freshly - Esencia Duelo - 25 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3127	50	38100119339	Pro Plan Veterinary Diets - Supplement Fortiflora X 30 Unid - 900 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3128	50	7501072209818	FELIX CLASSIC con Pescado Blanco - 85 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3129	50	7707205153472	Chunky Delicat Trozos De Pavo - 80 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3130	50	7709399777472	Br For Cat Control Bolas De Pelos - 60 GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3131	50	023100119335	Temptations - Snack Para Gatos Adultos Camarón - 180 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3132	50	7707205157746	Agility Gold - Piel Pequeños Adultos - 1.5 KG	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3133	50	023100604015	Royal Canin Urinary Dog Lata - 385 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3134	50	29534752161	Salvaje - Galletas para Gato Piel y Pelaje - 70 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3135	50	7707865301855	Besties - Snacks Nuggets Gatos Limpieza Dental - 75 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3136	50	7703381243518	NexGard Spectra - Tableta Masticable para Perros 30.1 - 60 KG - 30.1 - 60 KG	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3137	50	050000428946	Fancy Feast - Mousse Pescado Y Camarón - 85  GR	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3138	50	850006715336	Churu - Inaba Cat Diet - 50 UN	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3139	50	030111604484	Royal Canin - Adult Instinctive - 85  GR	8	8	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3140	50	8470000957512	Vecol Renalof Pets - 150 ML MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3141	50	050000290598	Félix - Paté Pescado Y Atún - 156  GR	6	6	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3142	50	7707912072646	Reeld´s - Ronik Grain Free Sabor Cordero - 500 GR	31	31	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3143	50	7707912072936	Reeld´s - Alimento Húmedo Ronik Grain Free Sabor Pollo - 500 GR	19	19	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3144	50	3182550768474	Royal Canin - Satiety Cat - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3145	50	052742852300	Hill'S Sd - Alimento Gato Adulto Piel Y Estómago Sensible Sabor Pollo - 3 LB	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3146	50	5414736042992	Revolution Plus - Antiparasitario Gatos TBX1 (2,5 Kg a 5 Kg) - 0,5 MILILITRO	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3147	50	850044321711	Con Sentido - Tapetes  Para Perros Grandes (12x19x34.5) - 14 Unds	22	22	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3148	50	4014355222433	Dr Clauders - Pavo y Arroz - 800 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3149	50	4014355339506	Dr. Clauders -  Cordero y arroz - 1 KG	1	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3150	50	3182550722605	Royal Canin - Shih Tzu Puppy - 1.5 KG	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3151	50	7898053582795	Vetnil - VitaVet C - 30 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3152	50	7707865305488	Belly Treats - Mix Parrillero - 200 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3153	50	7891000247846	Pro Plan - Alimento Humedo Gato Esterilizado 15 Sobres de 85 g - 15 Sobres x85 g	12	12	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3154	50	38100120144	Pro Plan Veterinary Diets - UR Urinary Care Feline - 156 GR	4	4	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3155	50	7708304362987	Basic Farm - Baxidin Solucion Antiseptica - 300 MILILITRO	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3156	50	855958006679	Churu - Inaba Cat Snack 4 Piezas Chicken With Cheese - 56 GR	7	7	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3157	50	7707205152918	Chunky - Lata Sabor Estofado De Res - 400 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3158	50	076484136061	Coastal Pet - Perro Bozal Basket - Talla 2	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3159	50	5414736047935	Simparica - Perros De 10 Hasta 20 Kg. - 1 Tableta	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3160	50	7707205152871	Agility Gold - Cachorros Primera Fase - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3161	50	7707865307048	Besties - Snacks Nuggets Gatos Sabor Salmón - 75 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3162	50	4913993146005	Codillos De Res Three Pets - 190 GR	2	2	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3163	50	857276007642	Churu - Inaba Tuna Variety Pack Bombonera - 50 uds	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3164	50	7707205153434	Chunky - Pouch Delidog Trozos De Carne De Res Adulto - 100 GR	5	5	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3165	50	7703681044716	Achiras Para Perro De Ternera - 150 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3166	50	7702084057101	Oh Maigat! - Caseros Y Delicados - 1.5 KG	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3167	50	7898574026853	Hydra - Colonia Groomers Forever Candy - 130 MILILITRO	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3168	50	7707319650508	Mypet - Bombonera Mix - 483 GR	1	1	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3169	50	7501072213839	Fancy Feast - Petit Filets Salmón Pouch - 85 GR	3	3	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
3170	50	7704614020104	Laboratorio Zoo - Alernex 10 tabletas - 10  MEDICAMENTOS	1	0	\N	sin_novedad	\N	VE24681	2025-09-21 20:53:15.394579
\.


--
-- TOC entry 4945 (class 0 OID 16523)
-- Dependencies: 225
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, correo, contrasena_hash, rol, creado_en) FROM stdin;
1	Jose Fernando Vertel Lobato	jose.vertel@laika.com.co	$2b$12$RrRFARBPtx0TyNfCbhWOg.EPMXR2d5WfLxNQvkejPUcW6XuCGTpBK	administrador	2025-09-18 03:55:38.155285
2	Felipe Castillo	felipe.castillo@laika.com.co	$2b$12$i7MgqDb02F1v31yfBdYSEe/Z1sSUTmX6UCOO17St2soVyV7Zzi8q.	auditor	2025-09-18 04:18:23.253987
3	Kevin Alcides Mendoza Acuña	kevin.mendoza@laika.com.co	$2b$12$IP/JBJcQkRDwgQdSPKXWOOsC9shferCEEBQYf3jetkRHywoWfeU5O	auditor	2025-09-21 01:56:44.015709
\.


--
-- TOC entry 4957 (class 0 OID 0)
-- Dependencies: 218
-- Name: archivos_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.archivos_auditoria_id_seq', 1, false);


--
-- TOC entry 4958 (class 0 OID 0)
-- Dependencies: 220
-- Name: auditorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditorias_id_seq', 50, true);


--
-- TOC entry 4959 (class 0 OID 0)
-- Dependencies: 222
-- Name: informes_generados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.informes_generados_id_seq', 1, false);


--
-- TOC entry 4960 (class 0 OID 0)
-- Dependencies: 224
-- Name: productos_auditados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_auditados_id_seq', 3170, true);


--
-- TOC entry 4961 (class 0 OID 0)
-- Dependencies: 226
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- TOC entry 4777 (class 2606 OID 16537)
-- Name: archivos_auditoria archivos_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivos_auditoria
    ADD CONSTRAINT archivos_auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 4779 (class 2606 OID 16539)
-- Name: auditorias auditorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4781 (class 2606 OID 16541)
-- Name: informes_generados informes_generados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.informes_generados
    ADD CONSTRAINT informes_generados_pkey PRIMARY KEY (id);


--
-- TOC entry 4783 (class 2606 OID 16543)
-- Name: productos_auditados productos_auditados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_auditados
    ADD CONSTRAINT productos_auditados_pkey PRIMARY KEY (id);


--
-- TOC entry 4785 (class 2606 OID 16545)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4787 (class 2606 OID 16547)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 16548)
-- Name: archivos_auditoria archivos_auditoria_auditoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivos_auditoria
    ADD CONSTRAINT archivos_auditoria_auditoria_id_fkey FOREIGN KEY (auditoria_id) REFERENCES public.auditorias(id);


--
-- TOC entry 4789 (class 2606 OID 16553)
-- Name: auditorias auditorias_auditor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4790 (class 2606 OID 16558)
-- Name: informes_generados informes_generados_analista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.informes_generados
    ADD CONSTRAINT informes_generados_analista_id_fkey FOREIGN KEY (analista_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4791 (class 2606 OID 16563)
-- Name: productos_auditados productos_auditados_auditoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_auditados
    ADD CONSTRAINT productos_auditados_auditoria_id_fkey FOREIGN KEY (auditoria_id) REFERENCES public.auditorias(id);


-- Completed on 2025-09-21 17:16:27

--
-- PostgreSQL database dump complete
--

\unrestrict 9gQbBUaqM2uHnA0aVBvwffC77ShPK2tw5lV5HIOte6brTl7WTIPT9lopap3EH8m

