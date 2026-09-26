"""Synthetic scientific regression tests; no network or source datasets required."""
import numpy as np
import pytest
from temperature_comparison_engine import (
    numeric, interpolate_no_extrapolation, calculate_metrics, qc_accepts,
    haversine_km, nearest_valid_cell, time_offsets, ranking_key)


def test_known_linear_interpolation():
    np.testing.assert_allclose(interpolate_no_extrapolation([0,10,20],[20,18,16],[0,5,10,15,20]),[20,19,18,17,16])


def test_no_extrapolation_and_exact_endpoints():
    a=interpolate_no_extrapolation([1,10],[20,11],[0,1,10,11,np.nan])
    np.testing.assert_allclose(a,[np.nan,20,11,np.nan,np.nan],equal_nan=True)


def test_masked_model_value_is_not_interpolated_or_bridged():
    a=interpolate_no_extrapolation([0,10,20],np.ma.array([20,99999,16],mask=[0,1,0]),[0,5,10,15,20])
    np.testing.assert_allclose(a,[20,np.nan,np.nan,np.nan,16],equal_nan=True)


def test_explicit_fill_is_not_temperature():
    a=interpolate_no_extrapolation([0,10,20],[20,99999,16],[5,10,15],fill_values=(99999,))
    assert np.isnan(a).all()
    assert np.isnan(numeric([99999],fill_values=(99999,))[0])


def test_signed_bias_and_metrics_known_values():
    m=calculate_metrics([10,20],[12,19])  # residuals +2, -1
    assert m['matched_level_count']==2
    assert m['mean_bias_celsius']==pytest.approx(.5)
    assert m['mae_celsius']==pytest.approx(1.5)
    assert m['rmse_celsius']==pytest.approx(np.sqrt(2.5))
    assert m['maximum_absolute_error_celsius']==2


def test_rmse_only_accepted_finite_matches():
    m=calculate_metrics([10,20,100,99999,np.nan],[12,19,0,0,0],
                        [True,True,False,True,True],fill_values=(99999,))
    assert m['matched_level_count']==2
    assert m['rmse_celsius']==pytest.approx(np.sqrt(2.5))


@pytest.mark.parametrize('bad_field',['PRES_ADJUSTED_QC','TEMP_ADJUSTED_QC','PSAL_ADJUSTED_QC'])
def test_provider_qc_rejected(bad_field):
    p={'position_qc':'1','time_qc':'1'}
    row={k:'1' for k in ['PRES_ADJUSTED_QC','TEMP_ADJUSTED_QC','PSAL_ADJUSTED_QC']}
    assert qc_accepts(p,row)
    row[bad_field]='4';assert not qc_accepts(p,row)


@pytest.mark.parametrize('field',['position_qc','time_qc'])
def test_bad_profile_qc_rejected(field):
    p={'position_qc':'1','time_qc':'1'};p[field]='9'
    row={k:'1' for k in ['PRES_ADJUSTED_QC','TEMP_ADJUSTED_QC','PSAL_ADJUSTED_QC']}
    assert not qc_accepts(p,row)


def test_nearest_valid_ocean_skips_land():
    cube=np.array([[[np.nan,20]],[[np.nan,10]]])
    iy,ix,d,col=nearest_valid_cell(0,0,[0,1],[0],[0,10],cube,[5],max_distance_km=120)
    assert (iy,ix)==(0,1)
    assert d==pytest.approx(111.19508023)
    np.testing.assert_allclose(col,[20,10])


def test_nearest_cell_must_support_valid_adjacent_bracket():
    cube=np.array([[[20,21]],[[np.nan,11]],[[0,1]]])
    _,ix,_,_=nearest_valid_cell(0,0,[0,1],[0],[0,10,20],cube,[5],max_distance_km=120)
    assert ix==1


def test_outside_geographic_coverage_rejected():
    with pytest.raises(ValueError,match='geographic'):
        nearest_valid_cell(-1,0,[0,1],[0],[0,10],np.ones((2,1,2)),[5])


def test_spatial_distance_limit_rejected():
    with pytest.raises(ValueError,match='spatial'):
        nearest_valid_cell(0,0,[0,1],[0],[0,10],np.array([[[np.nan,20]],[[np.nan,10]]]),[5],max_distance_km=10)


def test_distance_known_and_finite():
    assert haversine_km(0,0,0,0)==0
    assert haversine_km(0,0,1,0)==pytest.approx(111.19508023)
    a=haversine_km(179.9,0,-179.9,0)
    assert 0<a<23 and np.isfinite(a)


def test_daily_time_membership_and_two_offsets():
    args=['2024-01-02T00:00:00Z','2024-01-02T00:00:00Z','2024-01-03T00:00:00Z','2024-01-02T12:00:00Z']
    assert time_offsets('2024-01-02T14:30:00Z',*args)==(14.5,2.5)
    with pytest.raises(ValueError,match='averaging interval'):
        time_offsets('2024-01-03T00:00:00Z',*args)
    with pytest.raises(ValueError,match='averaging interval'):
        time_offsets('2024-01-01T23:59:59Z',*args)


@pytest.mark.parametrize('depths',[[0,0,10],[10,0,20],[0,np.nan,20]])
def test_invalid_model_depth_axis_rejected(depths):
    with pytest.raises(ValueError,match='ascending'):
        interpolate_no_extrapolation(depths,[20,15,10],[5])


def test_no_valid_matches_raises_not_zero_rmse():
    with pytest.raises(ValueError,match='No accepted'):
        calculate_metrics([np.nan],[10])


def test_ranking_is_count_first_not_lowest_rmse():
    a={'profile_id':'a','matched_level_count':50,'time_offset_hours':15,'spatial_distance_km':4,'rmse_celsius':2}
    b={'profile_id':'b','matched_level_count':49,'time_offset_hours':1,'spatial_distance_km':1,'rmse_celsius':.1}
    assert sorted([b,a],key=ranking_key)[0]==a


def test_metric_masks_cannot_become_fill_numbers():
    m=calculate_metrics(np.ma.array([10,99999],mask=[0,1]),[12,0])
    assert m['matched_level_count']==1 and m['rmse_celsius']==2


def test_qc_rejection_applies_to_final_metrics():
    p={'position_qc':'1','time_qc':'1'}
    rows=[{'PRES_ADJUSTED_QC':'1','TEMP_ADJUSTED_QC':t,'PSAL_ADJUSTED_QC':'1'} for t in ['1','4']]
    accepted=[qc_accepts(p,r) for r in rows]
    result=calculate_metrics([10,30],[12,0],accepted)
    assert result['matched_level_count']==1 and result['rmse_celsius']==2


def test_netcdf_packed_fill_is_masked_before_interpolation(tmp_path):
    import netCDF4 as nc
    f=tmp_path/'mini.nc'
    with nc.Dataset(f,'w') as d:
        d.createDimension('z',3)
        v=d.createVariable('thetao','i2',('z',),fill_value=-32767)
        v.scale_factor=.1;v.add_offset=0.;v.set_auto_maskandscale(False)
        v[:]=[200,-32767,100]
    with nc.Dataset(f) as d:
        values=d['thetao'][:]
        out=interpolate_no_extrapolation([0,10,20],values,[0,5,10,15,20])
    np.testing.assert_allclose(out,[20,np.nan,np.nan,np.nan,10],equal_nan=True)
